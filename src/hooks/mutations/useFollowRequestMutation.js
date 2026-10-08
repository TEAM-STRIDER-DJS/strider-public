import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  acceptFollowRequestApi,
  rejectFollowRequestApi,
} from "@src/api/followApi";
import { deleteNotificationApi } from "@src/api/notificationApi";
import { useAuthStore } from "@src/store/authStore";

/**
 * 팔로우 요청 수락/거절
 * 처리 후 해당 FOLLOW_REQUEST 알림을 서버에서 삭제(새로고침 시 재등장 방지) + 캐시에서 제거
 *
 * @param action "accept" | "reject"
 */
export function useFollowRequestMutation(action) {
  const queryClient = useQueryClient();
  const { userId } = useAuthStore();

  return useMutation({
    // followerId = 요청한 사람(알림의 actorUserId), notificationId = 알림 삭제/제거용
    mutationFn: async ({ followerId, notificationId }) => {
      if (action === "accept") {
        await acceptFollowRequestApi(userId, followerId);
      } else {
        await rejectFollowRequestApi(userId, followerId);
      }
      // 처리 완료된 요청 알림을 서버에서도 삭제 (실패해도 흐름은 성공 처리)
      if (notificationId) {
        try {
          await deleteNotificationApi(notificationId);
        } catch (e) {
          console.warn("요청 알림 삭제 실패:");
        }
      }
    },

    onSuccess: (_data, { notificationId }) => {
      // 처리된 요청 알림을 목록에서 제거
      queryClient.setQueryData(["notifications"], (prev) =>
        Array.isArray(prev)
          ? prev.filter((n) => n.id !== notificationId)
          : prev,
      );
      // TODO(백엔드 연동): 실제 알림 API 연동 시 invalidateQueries로 교체 가능
    },
  });
}
