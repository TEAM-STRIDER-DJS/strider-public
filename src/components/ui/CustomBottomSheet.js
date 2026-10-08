import React, { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
    View,
    StyleSheet,
    Dimensions,
    Animated,
    Pressable,
    Modal,
    PanResponder,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const CustomBottomSheet = React.forwardRef(({
    children,
    snapPoints = ['50%'],
    onClose,
}, ref) => {
    const [visible, setVisible] = useState(false);

    // snapPoints 처리 ('50%' -> SCREEN_HEIGHT * 0.5)
    const getSnapHeight = (snapPoint) => {
        if (typeof snapPoint === 'string' && snapPoint.endsWith('%')) {
            const percentage = parseFloat(snapPoint) / 100;
            return SCREEN_HEIGHT * percentage;
        }
        return snapPoint;
    };

    const heights = snapPoints.map(getSnapHeight);
    const MAX_HEIGHT = heights[heights.length - 1];
    const MIN_HEIGHT = heights[0];

    const animatedHeight = useRef(new Animated.Value(0)).current;
    const lastHeight = useRef(0);

    // 컴포넌트가 마운트되거나 visible이 true가 되었을 때 애니메이션 실행
    useEffect(() => {
        if (visible) {
            animatedHeight.setValue(0);
            Animated.spring(animatedHeight, {
                toValue: MIN_HEIGHT,
                useNativeDriver: false, // height는 native driver 미지원
                damping: 20,
                stiffness: 90,
            }).start(() => {
                lastHeight.current = MIN_HEIGHT;
            });
        }
    }, [visible, MIN_HEIGHT, animatedHeight]);

    const show = useCallback(() => {
        setVisible(true);
    }, []);

    const hide = useCallback(() => {
        Animated.timing(animatedHeight, {
            toValue: 0,
            duration: 250,
            useNativeDriver: false,
        }).start(() => {
            setVisible(false);
            lastHeight.current = 0;
            if (onClose) onClose();
        });
    }, [onClose, animatedHeight]);

    useImperativeHandle(ref, () => ({
        present: () => show(),
        dismiss: () => hide(),
    }));

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return Math.abs(gestureState.dy) > 5;
            },
            onPanResponderMove: (_, gestureState) => {
                const nextHeight = lastHeight.current - gestureState.dy; // 위로 올리면 (-)이므로 height 증가
                if (nextHeight >= 0) {
                    animatedHeight.setValue(Math.min(SCREEN_HEIGHT, nextHeight));
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                const currentHeight = lastHeight.current - gestureState.dy;

                // 아래로 강하게 밀거나 높이가 너무 작아지면 닫기
                if (gestureState.vy > 0.5 || currentHeight < MIN_HEIGHT * 0.4) {
                    hide();
                } else {
                    // 가장 가까운 snapPoint로 이동
                    const closest = heights.reduce((prev, curr) => {
                        return Math.abs(curr - currentHeight) < Math.abs(prev - currentHeight) ? curr : prev;
                    });

                    Animated.spring(animatedHeight, {
                        toValue: closest,
                        useNativeDriver: false,
                        damping: 20,
                        stiffness: 90,
                    }).start(() => {
                        lastHeight.current = closest;
                    });
                }
            },
        })
    ).current;

    if (!visible) return null;

    return (
        <Modal
            transparent
            visible={visible}
            animationType="none"
            onRequestClose={hide}
        >
            <View style={styles.overlay}>
                <Pressable style={styles.backdrop} onPress={hide} />
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1, justifyContent: 'flex-end' }}
                >
                    <Animated.View
                        style={[
                            styles.sheet,
                            {
                                height: animatedHeight,
                                maxHeight: MAX_HEIGHT,
                            },
                        ]}
                    >
                        <View {...panResponder.panHandlers} style={styles.handleContainer}>
                            <View style={styles.handle} />
                        </View>
                        <View style={styles.content}>
                            {children}
                        </View>
                    </Animated.View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
});

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    sheet: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        width: '100%',
        overflow: 'hidden', // 높이가 작아질 때 내부 컨텐츠 클램핑
    },
    handleContainer: {
        paddingVertical: 12,
        alignItems: 'center',
        width: '100%',
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#D1D5DB',
    },
    content: {
        flex: 1,
    },
});

export default CustomBottomSheet;
