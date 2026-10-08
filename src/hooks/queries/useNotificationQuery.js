import { useQuery } from "@tanstack/react-query";
import { getNotificationsApi } from "@src/api/notificationApi";

/**
 * 알림 목록 조회
 */
export function useNotificationsQuery() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => getNotificationsApi(),
    staleTime: 60 * 1000, // 1 minute
  });
}
