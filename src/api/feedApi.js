import { api } from "@src/lib/api";

// ────────────────────────────────────────────────────────────────────────────
// Feed
// ────────────────────────────────────────────────────────────────────────────

/** 피드 게시물 등록 (FeedPostRequest: exerciseId, review, mediaList[{sequence, mediaType, fileUrl, thumbnailUrl}]) */
export const createFeedApi = async ({ exerciseId, review, mediaList }) => {
    const res = await api.post(`/api/v1/strider/feed`, {
        exerciseId: exerciseId || null,
        review,
        mediaList,
    });
    return res.data;
};

/** 피드 상세 조회 */
export const getFeedDetailApi = async (postId) => {
    const res = await api.get(`/api/v1/strider/feed/${postId}`);
    return res.data;
};

/** 팔로우 중인 유저의 피드 목록 조회 */
export const getFollowFeedsApi = async () => {
    const res = await api.get(`/api/v1/strider/feed/follow?size=20`);
    // 응답 구조: { data: [...] } 또는 { data: { content: [...] } }
    const raw = res.data?.data ?? res.data;
    const list = Array.isArray(raw) ? raw : (raw?.content ?? []);
    return { data: list };
};

/** 추천 피드 목록 조회 (전용 API 생기면 엔드포인트 교체) */
export const getRecommendFeedsApi = async () => {
    const res = await api.get(`/api/v1/strider/feed/follow?size=30`);
    const raw = res.data?.data ?? res.data;
    const list = Array.isArray(raw) ? raw : (raw?.content ?? []);
    return { data: list };
};

/** 내 피드 목록 조회 */
export const getMyFeedsApi = async () => {
    const res = await api.get(`/api/v1/strider/feed/me?size=30`);
    const raw = res.data?.data ?? res.data;
    const list = Array.isArray(raw) ? raw : (raw?.content ?? []);
    return { data: list };
};

/** 특정 유저 피드 목록 조회 */
export const getUserFeedsApi = async (userId) => {
    const res = await api.get(`/api/v1/strider/feed/user/${userId}?size=30`);
    const raw = res.data?.data ?? res.data;
    const list = Array.isArray(raw) ? raw : (raw?.content ?? []);
    return { data: list };
};

// ────────────────────────────────────────────────────────────────────────────
// Feed Interactions
// ────────────────────────────────────────────────────────────────────────────

/** 피드 좋아요 토글 */
export const toggleFeedLikeApi = async (postId, isLiked) => {
    const method = isLiked ? "delete" : "post";
    const res = await api[method](`/api/v1/strider/feed/${postId}/like`);
    return res.data;
};

/** 피드 저장 토글 (저장=POST, 해제=DELETE) */
export const toggleFeedSaveApi = async (postId, isSaved) => {
    const method = isSaved ? "delete" : "post";
    const res = await api[method](`/api/v1/strider/feed/${postId}/save`);
    return res.data;
};

/** 저장한 피드 목록 조회 */
export const getSavedFeedsApi = async () => {
    const res = await api.get(`/api/v1/strider/feed/saved`);
    const raw = res.data?.data ?? res.data;
    const list = Array.isArray(raw) ? raw : (raw?.content ?? []);
    return { data: list };
};

// ────────────────────────────────────────────────────────────────────────────
// Comment
// ────────────────────────────────────────────────────────────────────────────

/** 댓글 목록 조회 */
export const getCommentsApi = async (feedId) => {
    const res = await api.get(`/api/v1/strider/feed/${feedId}/comment`);
    const raw = res.data?.data ?? res.data;
    const list = Array.isArray(raw) ? raw : [];
    return { data: list };
};

/** 대댓글 목록 조회 */
export const getRepliesApi = async (commentId) => {
    const res = await api.get(`/api/v1/strider/feed/comment/${commentId}/reply`);
    const raw = res.data?.data ?? res.data;
    const list = Array.isArray(raw) ? raw : [];
    return { data: list };
};

/** 댓글 작성 */
export const createCommentApi = async (postId, content) => {
    const res = await api.post(`/api/v1/strider/feed/comment`, {
        feedPostId: postId,
        commentText: content,
    });
    return res.data;
};

/** 대댓글 작성 */
export const createReplyApi = async (postId, commentId, content) => {
    const res = await api.post(`/api/v1/strider/feed/comment`, {
        feedPostId: postId,
        parentCommentId: commentId,
        commentText: content,
    });
    return res.data;
};

/** 댓글 삭제 */
export const deleteCommentApi = async (commentId) => {
    const res = await api.delete(`/api/v1/strider/feed/comment/${commentId}`);
    return res.data;
};

/** 댓글 좋아요 토글 */
export const toggleCommentLikeApi = async (commentId, isLiked) => {
    const method = isLiked ? "delete" : "post";
    const res = await api[method](`/api/v1/strider/feed/comment/${commentId}/like`);
    return res.data;
};

// ────────────────────────────────────────────────────────────────────────────
// Like Users
// ────────────────────────────────────────────────────────────────────────────

/** 피드 좋아요 유저 목록 조회 */
export const getPostLikesApi = async (postId) => {
    const res = await api.get(`/api/v1/strider/feed/${postId}/like/users`);
    const rawList = res.data?.data ?? res.data;

    if (!Array.isArray(rawList)) return [];

    return rawList.map((item) => {
        const userObj = item.member ?? item.user ?? item;

        // FollowCard 호환 필드 추출
        const userId = userObj.memberId ?? userObj.userId ?? userObj.id ?? item.memberId ?? item.userId;
        const nickname = userObj.nickname ?? userObj.userNickname ?? userObj.memberName ?? item.nickname ?? "알 수 없는 사용자";
        const profileImage = userObj.profileImage ?? userObj.userProfileImg ?? userObj.profileImgUrl ?? item.profileImage ?? null;
        const profileDesc = userObj.profileDesc ?? userObj.userDescription ?? userObj.bio ?? item.profileDesc ?? null;

        // 팔로우 상태 정규화 (Boolean -> String)
        let followStatus = "NOT_FOLLOWING";
        const rawStatus = (item.followStatus ?? userObj.followStatus)?.toUpperCase();
        const isFollowed = item.isFollowing ?? userObj.isFollowing ?? item.followed ?? userObj.followed ?? item.isFollow ?? userObj.isFollow;

        if (rawStatus === "FOLLOWING" || isFollowed === true) {
            followStatus = "FOLLOWING";
        } else if (rawStatus === "REQUESTED") {
            followStatus = "REQUESTED";
        }

        return {
            ...item,
            userId,
            nickname,
            profileImage,
            profileDesc,
            followStatus,
        };
    });
};
