import { useQuery } from "@tanstack/react-query";
import { getFeedDetailApi, getFollowFeedsApi, getRecommendFeedsApi, getCommentsApi, getRepliesApi, getMyFeedsApi, getUserFeedsApi, getSavedFeedsApi } from "@src/api/feedApi";

/**
 * 피드 상세 조회
 */
// ... (생략)

/**
 * 댓글 목록 조회
 */
export const useComments = (feedId) => {
    return useQuery({
        queryKey: ["comments", feedId],
        queryFn: () => getCommentsApi(feedId),
        enabled: !!feedId,
        select: (data) => data.data,
    });
};

/**
 * 대댓글 목록 조회 (Optional: 필요시 사용)
 */
export const useReplies = (commentId) => {
    return useQuery({
        queryKey: ["replies", commentId],
        queryFn: () => getRepliesApi(commentId),
        // 임시(낙관적) 댓글은 commentId가 Date.now() 숫자라 서버에 없음 → 404 방지.
        // 실제 댓글 id(UUID 문자열)일 때만 조회.
        enabled: !!commentId && typeof commentId === "string",
        select: (data) => data.data,
    });
};

/**
 * 피드 상세 조회
 */
export const useFeedDetail = (postId) => {
    return useQuery({
        queryKey: ["feed", postId],
        queryFn: () => getFeedDetailApi(postId),
        enabled: !!postId,
        select: (data) => data.data,
    });
};

/**
 * 팔로우 중인 피드 목록 조회
 */
export const useFollowFeeds = () => {
    return useQuery({
        queryKey: ["feeds"],
        queryFn: () => getFollowFeedsApi(),
        select: (data) => data.data,
    });
};

/**
 * 추천 피드 목록 조회
 */
export const useRecommendFeeds = () => {
    return useQuery({
        queryKey: ["feeds", "recommend"],
        queryFn: () => getRecommendFeedsApi(),
        select: (data) => data.data,
    });
};

/**
 * 프로필 피드 그리드 조회 (본인이면 /me, 아니면 /user/{userId})
 */
export const useProfileFeeds = (userId, isMe) => {
    return useQuery({
        queryKey: ["profileFeeds", isMe ? "me" : userId],
        queryFn: () => (isMe ? getMyFeedsApi() : getUserFeedsApi(userId)),
        enabled: isMe || !!userId,
        // 안전장치: 프로필 주인의 피드만 노출 (백엔드가 섞어줘도 방어)
        select: (data) => {
            const list = data.data ?? [];
            if (!userId) return list;
            return list.filter((f) => String(f.userId) === String(userId));
        },
    });
};

/**
 * 저장한 피드 목록 조회 (마이페이지 > 설정 > 저장됨)
 */
export const useSavedFeeds = () => {
    return useQuery({
        queryKey: ["savedFeeds"],
        queryFn: () => getSavedFeedsApi(),
        select: (data) => data.data,
    });
};
