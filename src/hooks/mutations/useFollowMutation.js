import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toggleFollowApi } from "@src/api/followApi";

export const useFollowMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, targetUserId, isFollowed }) =>
      toggleFollowApi(isFollowed, userId, targetUserId),

    onSuccess: (_, { targetUserId }) => {
      queryClient.invalidateQueries(["profile", targetUserId]);
      queryClient.invalidateQueries(["follow", targetUserId, "follower"]);
      queryClient.invalidateQueries(["follow", targetUserId, "following"]);
      queryClient.invalidateQueries(["profile", userId]);
      queryClient.invalidateQueries(["follow", userId, "follower"]);
      queryClient.invalidateQueries(["follow", userId, "following"]);
      // 좋아요 목록에 있는 유저의 팔로우 상태도 최신화하기 위해 likes 쿼리 무효화
      queryClient.invalidateQueries(["likes"]);
    },
  });
};
