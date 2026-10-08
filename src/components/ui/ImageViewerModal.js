import React, { useRef, useEffect } from 'react';
import { View, Image, Modal, Dimensions, Animated, PanResponder, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUiStore } from '@src/store/uiStore';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

export default function ImageViewerModal() {
    const { imageViewer, closeImageViewer } = useUiStore();
    const { visible, images, index } = imageViewer;

    const translateY = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.timing(opacity, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }).start();
        } else {
            opacity.setValue(0);
            translateY.setValue(0);
        }
    }, [visible]);

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return Math.abs(gestureState.dy) > 10;
            },
            onPanResponderMove: (_, gestureState) => {
                if (gestureState.dy > 0) {
                    translateY.setValue(gestureState.dy);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > 150 || gestureState.vy > 0.5) {
                    Animated.timing(translateY, {
                        toValue: height,
                        duration: 200,
                        useNativeDriver: true,
                    }).start(closeImageViewer);
                } else {
                    Animated.spring(translateY, {
                        toValue: 0,
                        useNativeDriver: true,
                    }).start();
                }
            },
        })
    ).current;

    if (!visible || images.length === 0) return null;

    // DUMMY_ASSET_MAP 복사
    const DUMMY_ASSET_MAP = {
        'onboard-1': require('../../../assets/strider-logo.png'),
        'onboard-2': require('../../../assets/strider-logo.png'),
        'onboard-3': require('../../../assets/strider-logo.png'),
        'strider-logo': require('../../../assets/strider-logo.png'),
    };

    const currentImage = images[index]?.fileUrl || images[index];
    const imageSource = DUMMY_ASSET_MAP[currentImage] || (currentImage?.startsWith('http') ? { uri: currentImage } : DUMMY_ASSET_MAP['onboard-1']);

    return (
        <Modal
            transparent
            visible={visible}
            animationType="none"
            onRequestClose={closeImageViewer}
        >
            <View className="flex-1 bg-black">
                <Animated.View
                    style={{
                        flex: 1,
                        opacity,
                        transform: [{ translateY }]
                    }}
                    {...panResponder.panHandlers}
                >
                    <SafeAreaView className="flex-1 justify-center items-center">
                        <TouchableOpacity
                            onPress={closeImageViewer}
                            className="absolute top-12 right-6 z-10 p-2"
                        >
                            <Ionicons name="close" size={32} color="white" />
                        </TouchableOpacity>

                        <Image
                            source={imageSource}
                            style={{ width, height: height * 0.7 }}
                            contentFit="contain"
                            resizeMode="contain"
                        />
                    </SafeAreaView>
                </Animated.View>
            </View>
        </Modal>
    );
}
