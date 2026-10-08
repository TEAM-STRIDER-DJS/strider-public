import { create } from "zustand";

/**
 * 피드 데이터 관리를 위한 전역 스토어
 * React Query의 서버 데이터와 동기화하거나, 낙관적 업데이트를 보조합니다.
 */
export const useFeedStore = create((set) => ({
    feeds: [], // 릴레이션 피드 목록

    /**
     * 피드 목록 업데이트
     */
    setFeeds: (feeds) => set({ feeds }),

    /**
     * 개별 피드 좋아요 상태 업데이트 (전역 UI 반영용)
     */
    updateFeedLike: (postId, isLiked, likeCount) => set((state) => ({
        feeds: state.feeds.map(f =>
            f.feedPostId === postId
                ? { ...f, userLike: isLiked, likeCount: likeCount }
                : f
        )
    })),

    /**
     * 개별 피드 저장 상태 업데이트
     */
    updateFeedSave: (postId, isSaved) => set((state) => ({
        feeds: state.feeds.map(f =>
            f.feedPostId === postId ? { ...f, userSave: isSaved } : f
        )
    })),

    /**
     * 상세 조회 시 해당 피드 정보 업데이트
     */
    updateFeedDetail: (detail) => set((state) => ({
        feeds: state.feeds.map(f =>
            f.feedPostId === detail.feedPostId ? { ...f, ...detail } : f
        )
    }))
}));
