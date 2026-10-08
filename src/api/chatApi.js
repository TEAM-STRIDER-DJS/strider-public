import { api } from "@src/lib/api";
import { getProfileInfo } from "@src/api/profileApi";
import { formatImageUrl } from "@src/utils/image";

export const getChatRoomsApi = async () => {
    const res = await api.get("/api/v1/strider/chat/rooms");
    const rawRooms = res.data?.data || [];

    // 각 방에 대해 프로필 데이터가 유효한지 확인하고, 없을 경우 우회 조회(getProfileInfo) 수행
    const mappedPromises = rawRooms.map(async (room) => {
        let avatarUrl = room.avatar ||
            room.otherUserProfileImage ||
            room.otherUserProfileImg ||
            room.otherUserProfileThumbImage ||
            room.profileImage ||
            room.profileImgUrl ||
            null;

        let finalRoomName = room.roomName ||
            room.otherUserNickname ||
            room.otherUserName ||
            null;

        // DIRECT 채팅방인 경우 항상 최신 상대방 프로필 정보(닉네임, 아바타) 연동
        if (room.roomType === "DIRECT" && room.otherUserId) {
            try {
                const profile = await getProfileInfo({ userId: room.otherUserId });
                if (profile) {
                    finalRoomName = profile.nickname || profile.memberName || finalRoomName;
                    avatarUrl = profile.profileImage || profile.profileThumbImage || avatarUrl;
                }
            } catch (err) {
                console.warn("[App] 이벤트 발생");
            }
        }

        // 최종 폴백 이름 지정
        if (!finalRoomName) {
            finalRoomName = room.otherUserId || "채팅방";
        }

        return {
            roomId: room.roomId,
            roomType: room.roomType,
            roomName: finalRoomName,
            avatar: formatImageUrl(avatarUrl),
            // 미디어 메시지의 "사진을 보냈습니다." 같은 문구는 서버가 만들어 준다 (MessagePreviewUtils)
            lastMessage: room.lastMessageContent || "",
            lastMessageType: room.lastMessageType || null,
            memberCount: room.memberCount || 0,
            unreadCount: room.unreadCount || 0,
            updatedAt: room.lastMessageAt || room.createdAt || new Date().toISOString(),
            notice: room.notice || null
        };
    });

    const mapped = await Promise.all(mappedPromises);
    return { data: mapped };
};

export const getOrCreateDirectRoomApi = async (receiverId) => {
    const res = await api.post(`/api/v1/strider/chat/rooms/direct/${receiverId}`);
    return { data: res.data?.data || {} };
};

export const getMessagesApi = async (roomId, params) => {
    const res = await api.get(`/api/v1/strider/chat/rooms/${roomId}/messages`, { params });
    // 백엔드 API 응답의 { data: [...] } 구조와 프론트엔드 기대 구조를 맞추어 반환
    return { data: res.data?.data || [] };
};

export const markAsReadApi = async (roomId) => {
    const res = await api.post(`/api/v1/strider/chat/rooms/${roomId}/read`);
    return { data: res.data?.data ?? true };
};

export const createGroupRoomApi = async (roomName, memberIds) => {
    const res = await api.post(`/api/v1/strider/chat/rooms/group`, { roomName, memberIds });
    return { data: res.data?.data || {} };
};

export const getRoomMembersApi = async (roomId) => {
    const res = await api.get(`/api/v1/strider/chat/rooms/${roomId}/members`);
    return { data: res.data?.data || [] };
};

export const leaveGroupRoomApi = async (roomId) => {
    const res = await api.delete(`/api/v1/strider/chat/rooms/${roomId}/members/me`);
    return { data: res.data?.data ?? true };
};

export const getMessageDetailApi = async (messageId) => {
    const res = await api.get(`/api/v1/strider/chat/messages/${messageId}`);
    return { data: res.data?.data || {} };
};

export const getUnreadMessagesApi = async (roomId, params) => {
    const res = await api.get(`/api/v1/strider/chat/rooms/${roomId}/messages/unread`, { params });
    return { data: res.data?.data || {} };
};

export const getInvitableMembersApi = async (roomId) => {
    const res = await api.get(`/api/v1/strider/chat/rooms/${roomId}/members/invitable`);
    return { data: res.data?.data || [] };
};

export const inviteMembersApi = async (roomId, memberIds) => {
    const res = await api.post(`/api/v1/strider/chat/rooms/${roomId}/members`, { memberIds });
    return { data: res.data?.data || [] };
};

// --- 채팅방 공지(Notice) API 6종 ---

/** 채팅 공지 리스트 조회 */
export const getNoticeListApi = async (roomId) => {
    const res = await api.get(`/api/v1/strider/chat/rooms/${roomId}/notices`);
    return { data: res.data?.data || [] };
};

/** 채팅 공지 상세 조회 */
export const getNoticeDetailApi = async (roomId, noticeId) => {
    const res = await api.get(`/api/v1/strider/chat/rooms/${roomId}/notices/${noticeId}`);
    return { data: res.data?.data || null };
};

/** 채팅 공지 등록 */
export const createNoticeApi = async (roomId, messageId) => {
    const res = await api.post(`/api/v1/strider/chat/rooms/${roomId}/notices`, { messageId });
    return { data: res.data?.data || {} };
};

/** 채팅 활성 공지 내리기 (해제) */
export const unregisterActiveNoticeApi = async (roomId) => {
    const res = await api.delete(`/api/v1/strider/chat/rooms/${roomId}/notices/active`);
    return { data: res.data?.data ?? true };
};

/** 채팅 공지 삭제 (목록에서도 완전 제거) */
export const deleteNoticeApi = async (roomId, noticeId) => {
    const res = await api.delete(`/api/v1/strider/chat/rooms/${roomId}/notices/${noticeId}`);
    return { data: res.data?.data ?? true };
};

/** 채팅 활성 공지 조회 (상단 배너용) */
export const getActiveNoticeApi = async (roomId) => {
    const res = await api.get(`/api/v1/strider/chat/rooms/${roomId}/notices/active`);
    return { data: res.data?.data || null };
};



/**
 * 채팅방 미디어 갤러리 조회.
 *
 * createdAt DESC + mediaId DESC 복합 커서의 단방향(과거로만) 페이지네이션이라
 * direction은 쓰지 않는다. 서버가 hasNext/nextCursor를 안 주므로
 * 응답 건수가 size보다 적으면 마지막 페이지로 본다.
 *
 * @param {object} params - { size, cursorCreatedAt, cursorId }
 */
export const getRoomMediaApi = async (roomId, params) => {
    const res = await api.get(`/api/v1/strider/chat/rooms/${roomId}/media`, { params });
    return { data: res.data?.data || [] };
};
