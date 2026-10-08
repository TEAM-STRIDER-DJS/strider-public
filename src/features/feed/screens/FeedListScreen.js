import React, { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Spinner } from '@gluestack-ui/themed';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import FeedPostCard from '../components/FeedPostCard';
import CommentBottomSheet from '../components/CommentBottomSheet';
import LikeBottomSheet from '../components/LikeBottomSheet';
import ShareBottomSheet from '../components/ShareBottomSheet';
import ImageViewerModal from '@src/components/ui/ImageViewerModal';
import { useFollowFeeds } from '@src/hooks/queries/useFeedQuery';
import { useUiStore } from '@src/store/uiStore';
import { useFeedStore } from '@src/store/feedStore';
import { useSharedBottomSheet } from '../hooks/useSharedBottomSheet';
import { useAuthStore } from '@src/store/authStore';
import { useProfileQuery } from '@src/hooks/queries/useProfileQuery';
import { formatImageUrl } from '@src/utils/image';

export default function FeedListScreen() {
    const router = useRouter();

    const { data: followPosts, isLoading: isFollowLoading, refetch: refetchFollow } = useFollowFeeds();
    const { feeds, setFeeds } = useFeedStore();

    const { userId } = useAuthStore();
    const { data: profile } = useProfileQuery(userId);
    const profileImageUrl = profile ? formatImageUrl(profile.profileImage || profile.profileThumbImage) : null;

    useEffect(() => {
        if (profile) {
            console.log("[FeedListScreen] 내 프로필 원본 데이터:");
            console.log("[FeedListScreen] 최종 가공된 프로필 이미지 URL:");
        } else {
            console.log("[FeedListScreen] 내 프로필 데이터를 로드하지 못했거나 아직 로딩 중입니다. userId:");
        }
    }, [profile, profileImageUrl, userId]);

    // 서버 데이터를 스토어와 동기화
    useEffect(() => {
        if (followPosts) {
            setFeeds(followPosts);
        }
    }, [followPosts, setFeeds]);

    // Zustand based UI state
    const { bottomSheet, closeBottomSheet, openImageViewer } = useUiStore();
    const { snapPoints, sheetRefs } = useSharedBottomSheet();

    const handleImagePress = (feedData, index) => {
        openImageViewer(feedData.mediaList, index);
    };

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
            {/* Top Header */}
            <View className="h-14 flex-row items-center justify-between px-4 border-b border-gray-100 bg-white">
                {/* 가운데 로고 */}
                <View
                    pointerEvents="none"
                    className="absolute left-0 right-0 top-0 bottom-0 items-center justify-center"
                >
                    <Image
                        source={require('@assets/strider-logo-header.png')}
                        style={{ width: 104, height: 30 }}
                        resizeMode="contain"
                    />
                </View>
                <View className="flex-row items-center">
                    {profileImageUrl ? (
                        <Image
                            source={{ uri: profileImageUrl }}
                            style={{ width: 36, height: 36, borderRadius: 18 }}
                            className="bg-gray-200"
                        />
                    ) : (
                        <View className="bg-gray-200 w-9 h-9 rounded-full" />
                    )}
                </View>
                <View className="flex-row items-center gap-4">
                    <TouchableOpacity onPress={() => router.push('/notification')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Ionicons name="notifications-outline" size={24} color="#333A44" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => router.push('/chat')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Ionicons name="chatbubble-outline" size={22} color="#333A44" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Main Feed List */}
            {isFollowLoading && (feeds || []).length === 0 ? (
                <View className="flex-1 justify-center items-center">
                    <Spinner size="large" />
                </View>
            ) : (
                <FlatList
                    data={feeds || []}
                    keyExtractor={(item) => String(item.feedPostId)}
                    renderItem={({ item }) => (
                        <FeedPostCard
                            data={item}
                            onPress={() => router.push({
                                pathname: `/feed/${item.feedPostId}`,
                                params: { source: 'home' }
                            })}
                            onImagePress={handleImagePress}
                        />
                    )}
                    onRefresh={refetchFollow}
                    refreshing={isFollowLoading}
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* Shared Bottom Sheets */}
            <CommentBottomSheet
                ref={sheetRefs.comment}
                snapPoints={snapPoints}
                postId={bottomSheet.data?.postId}
                onClose={closeBottomSheet}
            />
            <LikeBottomSheet
                ref={sheetRefs.like}
                snapPoints={snapPoints}
                onClose={closeBottomSheet}
            />
            <ShareBottomSheet
                ref={sheetRefs.share}
                snapPoints={snapPoints}
                postId={bottomSheet.data?.postId}
                onClose={closeBottomSheet}
            />

            <ImageViewerModal />
        </SafeAreaView>
    );
}
