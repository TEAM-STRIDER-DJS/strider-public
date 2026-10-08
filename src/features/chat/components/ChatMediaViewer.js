import React, { useEffect, useState } from 'react';
import { View, Text, Image, Modal, FlatList, TouchableOpacity, ActivityIndicator, StatusBar, Dimensions, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatImageUrl } from '@src/utils/image';
import { MEDIA_TYPE, getMediaThumbnailUrl } from '../messageTypes';
import { saveMediaToLibrary } from '../mediaDownload';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * 채팅 미디어 전체화면 뷰어 — 좌우로 넘겨 본다.
 *
 * 동영상은 인앱 플레이어 없이 preview 프레임 + ▶ 버튼으로 기기 기본 앱에 넘긴다
 * (ChatRoomScreen의 말풍선 탭 동작과 동일).
 *
 * @param {boolean} visible
 * @param {Array} mediaList - MediaResponse 배열
 * @param {number} initialIndex - 처음 보여줄 위치
 * @param {Function} onClose
 */
const ChatMediaViewer = ({ visible, mediaList = [], initialIndex = 0, onClose }) => {
    const [index, setIndex] = useState(initialIndex);
    const [isDownloading, setIsDownloading] = useState(false);

    // 다시 열 때마다 탭한 위치에서 시작해야 한다
    useEffect(() => {
        if (visible) setIndex(initialIndex);
    }, [visible, initialIndex]);

    const current = mediaList[index];

    const handleDownload = async () => {
        const url = formatImageUrl(current?.originalUrl);
        if (!url || isDownloading) return;
        setIsDownloading(true);
        await saveMediaToLibrary(url);
        setIsDownloading(false);
    };

    const handlePlayVideo = (media) => {
        const url = formatImageUrl(media?.originalUrl);
        if (!url) return;
        Linking.openURL(url).catch((err) => {
            console.warn("[ChatMediaViewer] 동영상 열기 실패:");
            Alert.alert('재생 실패', '동영상을 열 수 없습니다.');
        });
    };

    // 페이지 폭이 고정이라 계산으로 끝난다 — 없으면 initialScrollIndex가 어긋난다
    const getItemLayout = (_, i) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * i, index: i });

    const handleMomentumEnd = (e) => {
        const next = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
        if (next !== index) setIndex(next);
    };

    const renderPage = ({ item }) => {
        const isVideo = item?.mediaType === MEDIA_TYPE.VIDEO;
        // 동영상은 원본(mp4)을 Image로 그릴 수 없어 preview 프레임을 깐다
        const uri = formatImageUrl(isVideo ? getMediaThumbnailUrl(item) : item?.originalUrl);

        return (
            <View style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }} className="items-center justify-center">
                {uri ? (
                    <Image
                        source={{ uri }}
                        style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
                        resizeMode="contain"
                    />
                ) : (
                    <Text className="text-gray-400 text-sm">불러올 수 없는 항목이에요.</Text>
                )}

                {isVideo && (
                    <TouchableOpacity
                        onPress={() => handlePlayVideo(item)}
                        className="absolute w-20 h-20 rounded-full bg-black/60 items-center justify-center"
                    >
                        <Ionicons name="play" size={36} color="white" style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <Modal
            visible={visible}
            transparent={false}
            animationType="fade"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <StatusBar barStyle="light-content" />
            {/*
              Modal은 visible=false여도 자식을 마운트해 둔다.
              initialScrollIndex는 마운트 시점에만 적용되므로, visible로 감싸
              열 때마다 새로 마운트해야 탭한 위치에서 열린다.
            */}
            {visible && (
            <View className="flex-1 bg-black">
                <FlatList
                    key={initialIndex}
                    data={mediaList}
                    renderItem={renderPage}
                    keyExtractor={(item, i) => item?.mediaId || `viewer-${i}`}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    initialScrollIndex={initialIndex}
                    getItemLayout={getItemLayout}
                    onMomentumScrollEnd={handleMomentumEnd}
                />

                {/* 상단 바 — 이미지 위에 겹쳐 띄운다 */}
                <View className="absolute top-14 left-0 right-0 flex-row items-center justify-between px-4">
                    <TouchableOpacity
                        onPress={onClose}
                        className="w-10 h-10 rounded-full bg-black/50 items-center justify-center"
                    >
                        <Ionicons name="close" size={24} color="white" />
                    </TouchableOpacity>

                    <Text className="text-white text-sm font-medium">
                        {mediaList.length > 0 ? `${index + 1} / ${mediaList.length}` : ''}
                    </Text>

                    <TouchableOpacity
                        onPress={handleDownload}
                        disabled={isDownloading}
                        className="w-10 h-10 rounded-full bg-black/50 items-center justify-center"
                    >
                        {isDownloading ? (
                            <ActivityIndicator size="small" color="white" />
                        ) : (
                            <Ionicons name="download-outline" size={22} color="white" />
                        )}
                    </TouchableOpacity>
                </View>
            </View>
            )}
        </Modal>
    );
};

export default ChatMediaViewer;
