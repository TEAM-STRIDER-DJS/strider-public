import { create } from "zustand";

/**
 * 전역 UI 상태 관리를 위한 스토어
 * 바텀 시트, 모달 등의 표시 여부와 관련 데이터를 관리합니다.
 */
export const useUiStore = create((set) => ({
    // 바텀 시트 상태
    bottomSheet: {
        visible: false,
        type: null, // 'comment', 'like', 'share'
        data: null,  // 필요한 데이터 (postId 등)
        trigger: 0,  // 동일한 타입/데이터 호출 시에도 이펙트를 발생시키기 위한 카운터
    },

    /**
     * 바텀 시트 열기
     */
    openBottomSheet: (type, data = null) =>
        set((state) => ({
            bottomSheet: {
                visible: true,
                type,
                data,
                trigger: state.bottomSheet.trigger + 1
            },
        })),

    /**
     * 바텀 시트 닫기
     */
    closeBottomSheet: () =>
        set({
            bottomSheet: { visible: false, type: null, data: null, trigger: 0 },
        }),
    imageViewer: {
        visible: false,
        images: [],
        index: 0,
    },
    openImageViewer: (images, index = 0) =>
        set(() => ({
            imageViewer: { visible: true, images, index },
        })),
    closeImageViewer: () =>
        set(() => ({
            imageViewer: { visible: false, images: [], index: 0 },
        })),
}));
