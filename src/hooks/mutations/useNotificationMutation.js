import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  deleteAllNotificationsApi,
  markNotificationReadApi,
} from "@src/api/notificationApi";

/**
 * 알림 전체 삭제
 */
export function useDeleteAllNotificationsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAllNotificationsApi,
    onSuccess: () => {
      // 캐시 비우기 (mock 동작)
      queryClient.setQueryData(["notifications"], []);
      // TODO(백엔드 연동): 실제 API 연동 시 아래로 교체
      // queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

/**
 * 알림 읽음 처리
 */
export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markNotificationReadApi,
    onSuccess: (_data, notificationId) => {
      queryClient.setQueryData(["notifications"], (prev) =>
        prev?.map((n) =>
          n.id === notificationId ? { ...n, isRead: true } : n,
        ),
      );
    },
  });
}
