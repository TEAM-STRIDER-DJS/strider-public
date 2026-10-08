import { useQuery } from "@tanstack/react-query";
import { getFollowersApi, getFollowingsApi } from "@src/api/followApi";

/**
 * @param userId
 * @param type "follower" | "following"
 */
export function useFollowQuery({ userId, type }) {
  return useQuery({
    queryKey: ["follow", userId, type],
    queryFn: () =>
      type === "follower" ? getFollowersApi(userId) : getFollowingsApi(userId),
    enabled: !!userId && !!type,
    staleTime: 60 * 1000, // 1 minute
    keepPreviousData: true, // 탭 전환 시 기존 데이터 유지
  });
}
