import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getOrCreateDirectRoomApi, markAsReadApi, createNoticeApi, unregisterActiveNoticeApi, deleteNoticeApi } from "@src/api/chatApi";

export const useCreateDirectRoom = () => {
    return useMutation({
        mutationFn: (receiverId) => getOrCreateDirectRoomApi(receiverId),
    });
};

export const useMarkAsRead = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (roomId) => markAsReadApi(roomId),
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["chatRooms"] });
        },
    });
};

/** 공지 등록 뮤테이션 */
export const useCreateNotice = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ roomId, messageId }) => createNoticeApi(roomId, messageId),
        onSuccess: (_, { roomId }) => {
            queryClient.invalidateQueries({ queryKey: ["activeNotice", roomId] });
            queryClient.invalidateQueries({ queryKey: ["noticeList", roomId] });
        },
    });
};

/** 활성 공지 내리기 (해제) 뮤테이션 */
export const useUnregisterNotice = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (roomId) => unregisterActiveNoticeApi(roomId),
        onSuccess: (_, roomId) => {
            queryClient.invalidateQueries({ queryKey: ["activeNotice", roomId] });
            queryClient.invalidateQueries({ queryKey: ["noticeList", roomId] });
        },
    });
};

/** 공지 삭제 뮤테이션 */
export const useDeleteNotice = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ roomId, noticeId }) => deleteNoticeApi(roomId, noticeId),
        onSuccess: (_, { roomId }) => {
            queryClient.invalidateQueries({ queryKey: ["activeNotice", roomId] });
            queryClient.invalidateQueries({ queryKey: ["noticeList", roomId] });
        },
    });
};

