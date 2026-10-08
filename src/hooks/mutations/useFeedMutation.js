import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toggleFeedLikeApi, toggleFeedSaveApi, createFeedApi } from "@src/api/feedApi";
import { useFeedStore } from "@src/store/feedStore";

/**
 * 피드 관련 뮤테이션 훅
 */

// 좋아요 토글
export const useToggleFeedLike = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ postId, isLiked }) => toggleFeedLikeApi(postId, isLiked),
        onMutate: async ({ postId }) => {
            // 진행 중인 리프레시를 취소하여 낙관적 업데이트와 충돌 방지
            await queryClient.cancelQueries({ queryKey: ['feeds'] });
            await queryClient.cancelQueries({ queryKey: ['feed', postId] });

            // 최신 상태를 getState()를 통해 직접 가져옴 (중요: stale closure 방지)
            const currentFeeds = useFeedStore.getState().feeds;
            const updateFeedLike = useFeedStore.getState().updateFeedLike;

            const targetFeed = currentFeeds.find(f => String(f.feedPostId) === String(postId));
            if (targetFeed) {
                const prevLiked = targetFeed.userLike;
                const prevCount = targetFeed.likeCount || 0;

                const nextLiked = !prevLiked;
                const nextCount = nextLiked ? prevCount + 1 : Math.max(0, prevCount - 1);

                // 즉시 스토어 업데이트
                updateFeedLike(postId, nextLiked, nextCount);

                return { prevLiked, prevCount };
            }
            return null;
        },
        onError: (err, { postId }, context) => {
            // 에러 발생 시 이전 상태로 복구
            if (context) {
                updateFeedLike(postId, context.prevLiked, context.prevCount);
            }
        },
        onSettled: (data, err, { postId }) => {
            // 성공/실패 여부와 상관없이 서버 데이터와 싱크
            queryClient.invalidateQueries({ queryKey: ["feed", postId] });
            queryClient.invalidateQueries({ queryKey: ["feeds"] });
        },
    });
};

// 피드 게시물 등록
export const useCreateFeedMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createFeedApi,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["feeds"] });
        },
    });
};

// 저장 토글
export const useToggleFeedSave = () => {
    const queryClient = useQueryClient();
    const updateFeedSave = useFeedStore((state) => state.updateFeedSave);

    return useMutation({
        mutationFn: ({ postId, isSaved }) => toggleFeedSaveApi(postId, isSaved),
        onSuccess: (res, { postId }) => {
            // 서버 응답(FeedSaveResponse)은 { targetId, saved } 형태
            const updatedData = res.data;
            if (updatedData && typeof updatedData.saved === "boolean") {
                updateFeedSave(postId, updatedData.saved);
            }

            // 관련 쿼리 무효화
            queryClient.invalidateQueries({ queryKey: ["feed", postId] });
            queryClient.invalidateQueries({ queryKey: ["feeds"] });
            queryClient.invalidateQueries({ queryKey: ["savedFeeds"] });
        },
    });
};
