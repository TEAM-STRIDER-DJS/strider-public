import React, { useState } from 'react';
import { View, Text, Image, FlatList, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { formatImageUrl } from '@src/utils/image';
import { useRoomMedia } from '@src/hooks/queries/useChatQuery';
import { MEDIA_TYPE, getMediaThumbnailUrl } from '../messageTypes';
import ChatMediaViewer from '../components/ChatMediaViewer';

const { width } = Dimensions.get('window');
const SPACING = 1;
const NUM_COLUMNS = 3;
// 타일마다 오른쪽 여백이 붙으므로 여백 3개를 빼야 한 줄에 정확히 3개가 들어간다
const TILE_SIZE = Math.floor((width - SPACING * NUM_COLUMNS) / NUM_COLUMNS);

/**
 * 채팅방 미디어 갤러리 — 방에 올라온 사진·동영상을 최신순 3열 그리드로 모아 본다.
 *
 * 서버가 사진과 동영상을 한 목록에 섞어 내려주므로 타입 필터는 없다.
 */
const ChatMediaGalleryScreen = ({ roomId }) => {
    const router = useRouter();
    const [viewerIndex, setViewerIndex] = useState(null);

    const {
        data: mediaList,
        isLoading,
        error,
        hasNextPage,
        fetchNextPage,
        isFetchingNextPage,
    } = useRoomMedia(roomId);

    const handleEndReached = () => {
        if (hasNextPage && !isFetchingNextPage) fetchNextPage();
    };

    const renderTile = ({ item, index }) => {
        const isVideo = item?.mediaType === MEDIA_TYPE.VIDEO;
        const thumbUrl = formatImageUrl(getMediaThumbnailUrl(item));

        return (
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setViewerIndex(index)}
                style={{ width: TILE_SIZE, height: TILE_SIZE, marginRight: SPACING, marginBottom: SPACING }}
            >
                <Image
                    source={{ uri: thumbUrl }}
                    style={{ width: TILE_SIZE, height: TILE_SIZE }}
                    className="bg-gray-100"
                />
                {isVideo && (
                    <View className="absolute bottom-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 items-center justify-center">
                        <Ionicons name="play" size={12} color="white" style={{ marginLeft: 1 }} />
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    const renderBody = () => {
        if (isLoading) {
            return (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#0066FF" />
                </View>
            );
        }

        if (error) {
            return (
                <View className="flex-1 items-center justify-center">
                    <Text className="text-gray-400 text-sm">사진을 불러오지 못했어요.</Text>
                </View>
            );
        }

        return (
            <FlatList
                data={mediaList || []}
                renderItem={renderTile}
                keyExtractor={(item, index) => item?.mediaId || `media-${index}`}
                numColumns={NUM_COLUMNS}
                onEndReached={handleEndReached}
                onEndReachedThreshold={0.5}
                ListFooterComponent={
                    isFetchingNextPage ? (
                        <View className="py-6 items-center justify-center">
                            <ActivityIndicator size="small" color="#0066FF" />
                        </View>
                    ) : null
                }
                ListEmptyComponent={
                    <View className="py-16 items-center justify-center">
                        <MaterialIcons name="photo-library" size={40} color="#D1D5DB" />
                        <Text className="text-gray-400 text-sm mt-3">아직 주고받은 사진이 없어요.</Text>
                    </View>
                }
                contentContainerStyle={(mediaList || []).length === 0 ? { flexGrow: 1 } : undefined}
            />
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
            {/* 헤더 */}
            <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100">
                <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="chevron-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text className="text-xl font-bold ml-2">사진 / 동영상</Text>
            </View>

            {renderBody()}

            <ChatMediaViewer
                visible={viewerIndex !== null}
                mediaList={mediaList || []}
                initialIndex={viewerIndex ?? 0}
                onClose={() => setViewerIndex(null)}
            />
        </SafeAreaView>
    );
};

export default ChatMediaGalleryScreen;
