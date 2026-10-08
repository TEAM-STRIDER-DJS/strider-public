import React, { useRef, useState, useEffect, useMemo } from 'react';
import { View, Text, Image, Dimensions, FlatList, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Pressable, Avatar, AvatarImage, AvatarBadge } from '@gluestack-ui/themed';
import { useRouter } from 'expo-router';

import { useToggleFeedLike, useToggleFeedSave } from '@src/hooks/mutations/useFeedMutation';
import { useUiStore } from '@src/store/uiStore';
import { formatImageUrl } from '@src/utils/image';

const { width } = Dimensions.get('window');

// DUMMY_ASSET_MAP: 로컬 테스트용 이미지 매핑
const DUMMY_ASSET_MAP = {
    'onboard-1': require('../../../../assets/strider-logo.png'),
    'onboard-2': require('../../../../assets/strider-logo.png'),
    'onboard-3': require('../../../../assets/strider-logo.png'),
    'strider-logo': require('../../../../assets/strider-logo.png'),
};

const getImageSource = (fileUrl) => {
    if (fileUrl && DUMMY_ASSET_MAP[fileUrl]) {
        return DUMMY_ASSET_MAP[fileUrl];
    }
    if (fileUrl && (fileUrl.startsWith('http') || fileUrl.startsWith('data:'))) {
        return { uri: fileUrl };
    }
    return DUMMY_ASSET_MAP['onboard-1'];
};

const getProfileImageSource = (imgUrl) => {
    const formattedUrl = formatImageUrl(imgUrl);
    if (formattedUrl && (formattedUrl.startsWith('http') || formattedUrl.startsWith('data:'))) {
        return { uri: formattedUrl };
    }
    return require('@assets/strider-logo.png');
};

const VideoSlide = ({ uri, isActive, targetHeight, resizeMode = 'contain' }) => {
    // 로컬 에셋 처리
    const source = DUMMY_ASSET_MAP[uri] || uri;

    const player = useVideoPlayer(source, (player) => {
        player.loop = true;

        if (isActive) {
            player.muted = false; // 상세에서는 소리 켬 (쇼츠 느낌)
            player.play();
        } else {
            player.pause();
        }
    });

    useEffect(() => {
        if (isActive) {
            player.play();
        } else {
            player.pause();
        }
    }, [isActive, player]);

    return (
        <VideoView
            player={player}
            style={{ width: width, height: targetHeight }}
            contentFit={resizeMode}
            nativeControls={false}
        />
    );
};

export default function FeedPostCard({ data, onPress, onImagePress, variant = 'default', isFocused = true }) {
    const [activeIndex, setActiveIndex] = useState(0);

    const { mutate: toggleLike } = useToggleFeedLike();
    const { mutate: toggleSave } = useToggleFeedSave();
    const openBottomSheet = useUiStore((state) => state.openBottomSheet);
    const router = useRouter();

    const handleProfilePress = () => {
        if (!data.userId) return;
        router.push(`/(profile)/${data.userId}/profileInfo`);
    };

    const handleMediaPress = () => {
        if (onImagePress) {
            onImagePress(data, activeIndex);
        } else if (onPress) {
            onPress(data);
        }
    };

    const scale = useRef(new Animated.Value(1)).current;

    const isVideo = (m) => m?.mediaType === 'VIDEO' || m?.fileUrl?.includes('video');

    useEffect(() => {
        if (data.userLike) {
            Animated.sequence([
                Animated.timing(scale, { toValue: 1.2, duration: 100, useNativeDriver: true }),
                Animated.timing(scale, { toValue: 1, duration: 100, useNativeDriver: true }),
            ]).start();
        }
    }, [data.userLike]);

    // variant 'shorts'일 경우 전체 화면 비율로 설정
    const targetHeight = useMemo(() => {
        if (variant === 'shorts') {
            return Dimensions.get('window').height - 80; // 헤더 등 고려 (FeedDetailScreen 헤더 높이 제외)
        }
        return width;
    }, [variant]);

    return (
        <View className={`${variant === 'shorts' ? 'bg-black h-full' : 'bg-white border-b border-gray-100 mb-5 relative'}`}>
            {/* Header (Default Mode Only) */}
            {variant !== 'shorts' && (
                <View className="flex-row justify-between items-center py-3 px-4 border-b border-b-gray-50">
                    <Pressable onPress={handleProfilePress} className="flex-row items-center">
                        <Avatar size="sm" className="mr-3 bg-gray-100">
                            <AvatarImage
                                source={getProfileImageSource(data.userProfileImg)}
                                alt="Profile"
                            />
                        </Avatar>
                        <View>
                            <Text className="font-bold text-sm text-gray-800">{data.userNickname}</Text>
                            <Text className="text-xs text-gray-400">Strider Runner</Text>
                        </View>
                    </Pressable>
                    <Ionicons name="ellipsis-horizontal" size={20} color="#9CA3AF" />
                </View>
            )}

            {/* Media Content */}
            {data.mediaList?.length > 0 && (
                <View style={{ width: width, height: variant === 'shorts' ? '100%' : undefined, paddingBottom: variant === 'shorts' ? 150 : 0, justifyContent: 'center' }}>
                    <FlatList
                        data={data.mediaList}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onScroll={(e) => {
                            const x = e.nativeEvent.contentOffset.x;
                            setActiveIndex(Math.round(x / width));
                        }}
                        keyExtractor={(_, i) => String(i)}
                        renderItem={({ item, index }) => {
                            const isCellActive = isFocused && (index === activeIndex);

                            if (!isVideo(item)) {
                                return (
                                    <Pressable onPress={handleMediaPress} style={{ width: width, height: variant === 'shorts' ? '100%' : targetHeight, justifyContent: 'center', alignItems: 'center', backgroundColor: 'black' }}>
                                        <Image
                                            source={getImageSource(item.fileUrl)}
                                            style={{
                                                width: width,
                                                height: variant === 'shorts' ? '100%' : targetHeight,
                                            }}
                                            resizeMode={variant === 'shorts' ? 'contain' : 'cover'}
                                        />
                                    </Pressable>
                                )
                            } else {
                                return (
                                    <Pressable onPress={handleMediaPress} style={{ width: width, height: variant === 'shorts' ? '100%' : targetHeight, justifyContent: 'center', alignItems: 'center', backgroundColor: 'black' }}>
                                        <VideoSlide
                                            uri={item.fileUrl}
                                            isActive={isCellActive}
                                            targetHeight={variant === 'shorts' ? '100%' : targetHeight}
                                            resizeMode={variant === 'shorts' ? 'contain' : 'contain'} // 잘리지 않게 동일하게 출력
                                        />
                                    </Pressable>
                                )
                            }
                        }}
                    />

                    {/* Page Indicators */}
                    {data.mediaList.length > 1 && (
                        <View className={`flex-row justify-center absolute left-0 right-0 ${variant === 'shorts' ? 'bottom-8' : 'bottom-4'}`}>
                            {data.mediaList.map((_, i) => (
                                <View
                                    key={i}
                                    className={`w-1.5 h-1.5 rounded-full mx-1 ${i === activeIndex ? 'bg-white' : 'bg-white/50'}`}
                                />
                            ))}
                        </View>
                    )}
                </View>
            )}

            {/* SHORTS MODE OVERLAY UI (Reels Style) */}
            {variant === 'shorts' ? (
                <View className="absolute bottom-0 w-full flex-row items-end justify-between px-4 pb-16">
                    {/* Left Side: Profile & Description */}
                    <View className="flex-1 mr-12 mb-2">
                        <Pressable onPress={handleProfilePress} className="flex-row items-center mb-3">
                            <Image
                                source={getProfileImageSource(data.userProfileImg)}
                                style={{ width: 32, height: 32, borderRadius: 16, marginRight: 8, backgroundColor: '#6B7280' }}
                            />
                            <Text className="font-extrabold text-white text-sm shadow-sm">{data.userNickname}</Text>
                        </Pressable>
                        <Text numberOfLines={2} className="font-medium text-white text-sm leading-5 shadow-sm">
                            {data.review}
                        </Text>
                    </View>

                    {/* Right Side: Actions (Vertical) */}
                    <View className="items-center gap-5">
                        <View className="items-center">
                            <Pressable onPress={() => toggleLike({ postId: data.feedPostId, isLiked: data.userLike })} className="items-center">
                                <Animated.View style={{ transform: [{ scale }] }}>
                                    <Ionicons name={data.userLike ? "heart" : "heart-outline"} size={28} color="white" style={{ opacity: 1, textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }} />
                                </Animated.View>
                            </Pressable>
                            <Pressable onPress={() => openBottomSheet('like', { postId: data.feedPostId })} className="mt-1">
                                <Text className="text-white text-xs font-medium shadow-sm">{data.likeCount}</Text>
                            </Pressable>
                        </View>

                        <Pressable onPress={() => openBottomSheet('comment', { postId: data.feedPostId })} className="items-center">
                            <Ionicons name="chatbubble-outline" size={26} color="white" style={{ textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }} />
                            <Text className="text-white text-xs mt-1 font-medium shadow-sm">{data.commentCount}</Text>
                        </Pressable>

                        <Pressable onPress={() => openBottomSheet('share', { postId: data.feedPostId })} className="items-center">
                            <Ionicons name="paper-plane-outline" size={26} color="white" style={{ textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }} />
                        </Pressable>

                        <Pressable onPress={() => toggleSave({ postId: data.feedPostId, isSaved: data.userSave })} className="items-center">
                            <Ionicons name={data.userSave ? "bookmark" : "bookmark-outline"} size={26} color="white" style={{ textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }} />
                        </Pressable>

                        <Pressable className="items-center mt-1">
                            <Ionicons name="ellipsis-horizontal" size={24} color="white" style={{ opacity: 0.8 }} />
                        </Pressable>
                    </View>
                </View>
            ) : (
                /* DEFAULT MODE UI */
                <>
                    {/* Actions */}
                    <View className='flex-row justify-between items-center py-3 px-4'>
                        <View className='flex-row items-center gap-4'>
                            <View className="flex-row items-center">
                                <Pressable onPress={() => toggleLike({ postId: data.feedPostId, isLiked: data.userLike })}>
                                    <Animated.View style={{ transform: [{ scale }] }}>
                                        <Ionicons name={data.userLike ? "heart" : "heart-outline"} size={26} color={data.userLike ? "#E11D48" : "#1F2937"} />
                                    </Animated.View>
                                </Pressable>
                                {data.likeCount > 0 && (
                                    <Pressable onPress={() => openBottomSheet('like', { postId: data.feedPostId })} className="ml-1.5 p-1">
                                        <Text className='font-bold text-sm text-gray-900'>{data.likeCount}</Text>
                                    </Pressable>
                                )}
                            </View>

                            <Pressable onPress={() => openBottomSheet('comment', { postId: data.feedPostId })} className="flex-row items-center">
                                <Ionicons name="chatbubble-outline" size={24} color="#1F2937" />
                                {data.commentCount > 0 && <Text className='font-bold ml-1.5 text-sm text-gray-900'>{data.commentCount}</Text>}
                            </Pressable>

                            <Pressable onPress={() => openBottomSheet('share', { postId: data.feedPostId })}>
                                <Ionicons name="paper-plane-outline" size={24} color="#1F2937" />
                            </Pressable>
                        </View>

                        <Pressable onPress={() => toggleSave({ postId: data.feedPostId, isSaved: data.userSave })}>
                            <Ionicons name={data.userSave ? "bookmark" : "bookmark-outline"} size={24} color="#1F2937" />
                        </Pressable>
                    </View>

                    {/* Description */}
                    <View className='px-4 pb-3'>
                        <Text numberOfLines={2}>
                            <Text onPress={handleProfilePress} className='font-bold text-gray-900'>{data.userNickname}  </Text>
                            <Text className="text-gray-700 leading-5">{data.review}</Text>
                        </Text>
                    </View>
                </>
            )}
        </View>
    );
}
