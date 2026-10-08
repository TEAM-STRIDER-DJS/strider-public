import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import { BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { useUiStore } from '@src/store/uiStore';

/**
 * 전역 UI 스토어와 실제 바텀 시트 컴포넌트를 연결해주는 헬퍼 훅
 */
export const useSharedBottomSheet = () => {
    const { bottomSheet, closeBottomSheet } = useUiStore();

    // 시트들을 제어하기 위한 Ref들
    const commentSheetRef = useRef(null);
    const likeSheetRef = useRef(null);
    const shareSheetRef = useRef(null);

    const snapPoints = useMemo(() => ['50%', '90%'], []);

    const renderBackdrop = useCallback(
        (props) => (
            <BottomSheetBackdrop
                {...props}
                disappearsAtIndex={-1}
                appearsAtIndex={0}
                opacity={0.5}
            />
        ),
        []
    );

    // 스토어 상태 감시 및 시트 열기/닫기 처리
    useEffect(() => {
        if (bottomSheet.visible && bottomSheet.trigger > 0) {
            switch (bottomSheet.type) {
                case 'comment':
                    commentSheetRef.current?.present();
                    break;
                case 'like':
                    likeSheetRef.current?.present(bottomSheet.data);
                    break;
                case 'share':
                    shareSheetRef.current?.present(bottomSheet.data);
                    break;
            }
        } else if (!bottomSheet.visible) {
            // 모두 닫기
            commentSheetRef.current?.dismiss();
            likeSheetRef.current?.dismiss();
            shareSheetRef.current?.dismiss();
        }
    }, [bottomSheet.visible, bottomSheet.type, bottomSheet.trigger]);

    return {
        snapPoints,
        renderBackdrop,
        sheetRefs: {
            comment: commentSheetRef,
            like: likeSheetRef,
            share: shareSheetRef
        }
    };
};
