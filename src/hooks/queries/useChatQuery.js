import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { getChatRoomsApi, getMessagesApi, getRoomMembersApi, getActiveNoticeApi, getNoticeListApi, getRoomMediaApi } from "@src/api/chatApi";

export const useChatRooms = () => {
    return useQuery({
        queryKey: ["chatRooms"],
        queryFn: getChatRoomsApi,
        select: (data) => data.data,
    });
};

export const useMessages = (roomId) => {
    return useQuery({
        queryKey: ["messages", roomId],
        queryFn: () => getMessagesApi(roomId, { size: 30 }),
        enabled: !!roomId,
        select: (data) => data.data,
    });
};

export const useRoomMembers = (roomId) => {
    return useQuery({
        queryKey: ["roomMembers", roomId],
        queryFn: () => getRoomMembersApi(roomId),
        enabled: !!roomId,
        select: (data) => data.data,
    });
};

/** 활성 공지 조회 쿼리 (상단 배너용) */
export const useActiveNotice = (roomId) => {
    return useQuery({
        queryKey: ["activeNotice", roomId],
        queryFn: () => getActiveNoticeApi(roomId),
        enabled: !!roomId,
        select: (data) => data.data,
    });
};

/** 방의 공지 목록 조회 쿼리 */
export const useNoticeList = (roomId) => {
    return useQuery({
        queryKey: ["noticeList", roomId],
        queryFn: () => getNoticeListApi(roomId),
        enabled: !!roomId,
        select: (data) => data.data,
    });
};

/** 미디어 갤러리 한 페이지 크기 (서버 기본값과 동일) */
export const MEDIA_PAGE_SIZE = 30;

/**
 * 채팅방 미디어 갤러리 무한스크롤 쿼리.
 *
 * 서랍 프리뷰와 갤러리 화면이 같은 queryKey를 공유하므로
 * 서랍에서 이미 받아둔 첫 페이지가 화면 진입 시 그대로 재사용된다.
 */
export const useRoomMedia = (roomId, options = {}) => {
    const { enabled = true, ...rest } = options;

    return useInfiniteQuery({
        queryKey: ["roomMedia", roomId],
        enabled: !!roomId && enabled,
        initialPageParam: null,
        queryFn: ({ pageParam }) =>
            getRoomMediaApi(roomId, {
                size: MEDIA_PAGE_SIZE,
                // 최초 조회는 커서 없이 — pageParam은 { cursorCreatedAt, cursorId }
                ...(pageParam ?? {}),
            }),
        // 서버가 hasNext/nextCursor를 안 내려준다. size 미만이면 마지막 페이지.
        getNextPageParam: (lastPage) => {
            const items = lastPage?.data || [];
            if (items.length < MEDIA_PAGE_SIZE) return undefined;
            const last = items[items.length - 1];
            return { cursorCreatedAt: last.createdAt, cursorId: last.mediaId };
        },
        select: (data) => data.pages.flatMap((page) => page?.data || []),
        ...rest,
    });
};
