import { create } from "zustand";

/**
 * 서버 날짜 문자열을 timestamp로 변환.
 * "2026-03-15T10:00:00" / "2026-03-15 10:00:00" 두 형태를 모두 받아 준다.
 */
const toTime = (dateString) => {
    if (!dateString) return NaN;
    let time = new Date(dateString).getTime();
    if (isNaN(time) && typeof dateString === "string") {
        time = new Date(dateString.replace(" ", "T")).getTime();
    }
    return time;
};

export const useChatStore = create((set) => ({
    stompClient: null,
    isConnected: false,
    currentRoomId: null,
    subscription: null,
    messages: [],
    // 방 구성원별 마지막 읽음 시각 { [userId]: readAt } — 같은 읽음 이벤트를 두 번 반영하지 않기 위한 기준
    readReceipts: {},

    setStompClient: (client) => set({ stompClient: client }),
    setIsConnected: (connected) => set({ isConnected: connected }),
    setCurrentRoom: (roomId) => set({ currentRoomId: roomId }),
    setSubscription: (sub) => set({ subscription: sub }),
    setMessages: (messages) => set({ messages }),

    /**
     * 메시지 추가.
     *
     * 중복 판정은 messageId와 clientMessageId로만 한다.
     * 예전에는 "같은 발신자 + 같은 content"를 중복으로 봤는데,
     *  - 미디어 메시지는 서버 정책상 content가 항상 빈 문자열이라 전부 한 건으로 뭉개지고
     *  - 사용자가 같은 문장을 두 번 보내면 두 번째가 사라졌다.
     * 서버가 (roomId, clientMessageId)로 중복 저장을 막고 응답에도 그대로 실어 주므로
     * 그 값을 기준으로 삼는다.
     */
    addMessage: (msg) => set((state) => {
        if (!msg) return state;
        const msgId = msg.messageId || msg.id;
        const clientMessageId = msg.clientMessageId;

        // 1. 같은 messageId가 이미 있으면 무시 (숫자/문자열 타입 불일치 대비해 String 비교)
        if (msgId) {
            const exactDuplicate = state.messages.some((m) => {
                const existingId = m.messageId || m.id;
                return existingId && String(existingId) === String(msgId);
            });
            if (exactDuplicate) return state;
        }

        // 2. 같은 clientMessageId의 로컬 낙관 메시지가 있으면 서버 정식 메시지로 교체
        if (clientMessageId) {
            const localIndex = state.messages.findIndex(
                (m) => m.clientMessageId === clientMessageId && m.status
            );
            if (localIndex !== -1) {
                const updated = [...state.messages];
                updated[localIndex] = msg;
                return { messages: updated };
            }
            // 로컬 항목 없이 같은 clientMessageId가 이미 있으면 재브로드캐스트 → 무시
            const alreadyExists = state.messages.some((m) => m.clientMessageId === clientMessageId);
            if (alreadyExists) return state;
        }

        return { messages: [msg, ...state.messages] };
    }),

    /**
     * /sub/chat/room/{roomId}/read 브로드캐스트 반영.
     * payload: { roomId, userId, readAt }
     *
     * readAt 이하의 메시지 중 해당 사용자가 아직 읽지 않았던 것만 unreadCount를 1 줄인다.
     *
     * 서버(ChatService.buildResponseWithUnread)는 broadcast 시점에 해당 방을 보고 있던
     * 멤버를 unreadCount에서 이미 빼고 그 목록을 preExcludedUserIds로 내려준다.
     * 그 멤버가 뒤이어 read를 발행하면 여기서 또 빼면 안 되므로 건너뛴다.
     *
     * readReceipts에 이전 readAt을 남겨 두고 그 이후 구간만 처리하므로,
     * 같은 사용자가 read를 반복 발행해도 중복 차감되지 않는다.
     *
     * ※ 자기 자신의 읽음 이벤트는 호출 전에 걸러야 한다 (내가 방에 있는 동안 도착한
     *   메시지는 서버가 이미 나를 제외하고 계산해서 보내기 때문).
     */
    applyReadReceipt: ({ userId, readAt }) => set((state) => {
        if (!userId || !readAt) return state;

        const readTime = toTime(readAt);
        if (isNaN(readTime)) return state;

        const prevReadAt = state.readReceipts[userId];
        const prevTime = prevReadAt ? toTime(prevReadAt) : null;
        // 순서가 뒤바뀐(또는 동일한) 이벤트는 무시
        if (prevTime !== null && !isNaN(prevTime) && readTime <= prevTime) return state;

        const messages = state.messages.map((m) => {
            // 발신자 본인은 unreadCount 집계 대상이 아니다
            if (String(m.senderId) === String(userId)) return m;
            if (typeof m.unreadCount !== "number" || m.unreadCount <= 0) return m;
            // 서버가 broadcast 때 이미 제외한 멤버 → 이중 차감 방지
            if (m.preExcludedUserIds?.some((id) => String(id) === String(userId))) return m;

            const createdTime = toTime(m.createdAt);
            if (isNaN(createdTime) || createdTime > readTime) return m;
            // 이전 readAt까지는 이미 반영된 구간
            if (prevTime !== null && !isNaN(prevTime) && createdTime <= prevTime) return m;

            return { ...m, unreadCount: m.unreadCount - 1 };
        });

        return {
            messages,
            readReceipts: { ...state.readReceipts, [userId]: readAt },
        };
    }),

    /**
     * 방 입장 시 멤버별 마지막 읽음 시각을 기준선으로 깔아 둔다.
     * entries: [{ userId, lastReadAt }] (getRoomMembersApi 응답)
     *
     * 이 값이 없으면 어떤 멤버의 첫 read 이벤트가 도착했을 때
     * prevTime이 null이라 "그 시각 이전 메시지 전부"를 차감해 버린다.
     * 그 멤버가 이미 오래전에 읽어서 서버 unreadCount에 반영이 끝난 메시지까지
     * 한 번 더 깎이므로, 안 읽은 사람이 있는데도 숫자가 사라지는 현상이 생긴다.
     *
     * 이미 소켓으로 더 최신 readAt을 받아 둔 멤버는 덮어쓰지 않는다.
     */
    seedReadReceipts: (entries) => set((state) => {
        if (!Array.isArray(entries) || entries.length === 0) return state;

        const seeded = { ...state.readReceipts };
        let changed = false;

        entries.forEach((entry) => {
            const id = entry?.userId;
            const lastReadAt = entry?.lastReadAt;
            if (!id || !lastReadAt) return;

            const nextTime = toTime(lastReadAt);
            if (isNaN(nextTime)) return;

            const prevTime = seeded[id] ? toTime(seeded[id]) : null;
            if (prevTime !== null && !isNaN(prevTime) && nextTime <= prevTime) return;

            seeded[id] = lastReadAt;
            changed = true;
        });

        return changed ? { readReceipts: seeded } : state;
    }),

    removeMessage: (msgId) => set((state) => ({
        messages: state.messages.filter((m) => (m.messageId || m.id) !== msgId),
    })),

    updateMessageStatus: (msgId, status) => set((state) => ({
        messages: state.messages.map((m) =>
            (m.messageId || m.id) === msgId ? { ...m, status } : m
        ),
    })),

    clearRoom: () => set({
        currentRoomId: null,
        subscription: null,
        messages: [],
        readReceipts: {},
    }),
}));
