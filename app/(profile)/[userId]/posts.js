import React, { useRef, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Spinner } from '@gluestack-ui/themed';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import FeedPostCard from '@src/features/feed/components/FeedPostCard';
import CommentBottomSheet from '@src/features/feed/components/CommentBottomSheet';
import LikeBottomSheet from '@src/features/feed/components/LikeBottomSheet';
import ShareBottomSheet from '@src/features/feed/components/ShareBottomSheet';
import ImageViewerModal from '@src/components/ui/ImageViewerModal';
import { useProfileFeeds } from '@src/hooks/queries/useFeedQuery';
import { useProfileQuery } from '@src/hooks/queries/useProfileQuery';
import { useUiStore } from '@src/store/uiStore';
import { useSharedBottomSheet } from '@src/features/feed/hooks/useSharedBottomSheet';
import { useAuthStore } from '@src/store/authStore';
import { toDateKey } from '@src/utils/date';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ProfilePostsScreen() {
    const { userId, postId, date } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const myUserId = useAuthStore((state) => state.userId);
    const isMe = String(userId) === String(myUserId);

    const { data: feeds, isLoading } = useProfileFeeds(userId, isMe);
    // 이 화면의 모든 글은 같은 유저(userId) 작성 → 프로필 이미지/닉네임을 보강
    const { data: profile, isLoading: profileLoading } = useProfileQuery(userId);

    const headerHeight = 50;
    const itemHeight = SCREEN_HEIGHT - insets.top - insets.bottom - headerHeight;

    const posts = React.useMemo(() => {
        // 프로필 화면에서 정상 렌더되는 profileImage를 우선 사용
        // (목록 응답의 userProfileImg는 깨진 썸네일일 수 있어 폴백으로만)
        const profileImg = profile?.profileImage || profile?.profileThumbImage || null;
        let list = (feeds ?? []).map((p) => ({
            ...p,
            userProfileImg: profileImg || p.userProfileImg || null,
            userNickname: p.userNickname || profile?.nickname,
        }));

        // 날짜로 진입한 경우(캘린더) — 해당 일자의 게시물만 표시
        if (date) {
            list = list.filter((p) => toDateKey(p.createdAt) === date);
        }

        // 특정 게시물부터 시작 — 해당 글을 맨 위로
        if (postId) {
            const target = list.find((p) => String(p.feedPostId) === String(postId));
            if (target) {
                list = [target, ...list.filter((p) => String(p.feedPostId) !== String(postId))];
            }
        }
        return list;
    }, [feeds, postId, date, profile]);

    const { bottomSheet, closeBottomSheet, openImageViewer } = useUiStore();
    const { snapPoints, sheetRefs } = useSharedBottomSheet();

    const handleImagePress = (feedData, index) => {
        openImageViewer(feedData.mediaList, index);
    };

    const [viewableIndex, setViewableIndex] = useState(0);
    const onViewableItemsChanged = useRef(({ viewableItems }) => {
        if (viewableItems && viewableItems.length > 0) {
            setViewableIndex(viewableItems[0].index);
        }
    }).current;
    const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 80 }).current;

    // 프로필 이미지가 첫 렌더부터 카드에 반영되도록 프로필 로딩을 (posts 유무와 무관하게) 대기
    if (profileLoading || (isLoading && posts.length === 0)) {
        return (
            <View className="flex-1 justify-center items-center bg-white">
                <Spinner size="large" />
            </View>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-black" edges={['top', 'bottom']}>
            {/* Header */}
            <View style={{ height: headerHeight }} className="flex-row items-center px-4 bg-black">
                <TouchableOpacity onPress={() => router.back()} style={{ width: 32 }}>
                    <Ionicons name="chevron-back" size={26} color="white" />
                </TouchableOpacity>
                <Text className="flex-1 text-center text-base font-bold text-white">
                    {date ? date.replaceAll('-', '.') : '게시물'}
                </Text>
                <View style={{ width: 32 }} />
            </View>

            {posts.length === 0 ? (
                <View className="flex-1 justify-center items-center bg-black">
                    <Text className="text-gray-400 text-sm">아직 게시물이 없어요.</Text>
                </View>
            ) : (
                <FlatList
                    data={posts}
                    keyExtractor={(item) => String(item.feedPostId)}
                    renderItem={({ item, index }) => (
                        <View style={{ height: itemHeight, justifyContent: 'center', backgroundColor: 'black' }}>
                            <FeedPostCard
                                data={item}
                                onImagePress={handleImagePress}
                                onPress={() => {}}
                                variant="shorts"
                                isFocused={index === viewableIndex}
                            />
                        </View>
                    )}
                    showsVerticalScrollIndicator={false}
                    pagingEnabled
                    snapToAlignment="start"
                    decelerationRate="fast"
                    snapToInterval={itemHeight}
                    getItemLayout={(_, index) => ({ length: itemHeight, offset: itemHeight * index, index })}
                    onViewableItemsChanged={onViewableItemsChanged}
                    viewabilityConfig={viewabilityConfig}
                />
            )}

            {/* Shared Bottom Sheets */}
            <CommentBottomSheet
                ref={sheetRefs.comment}
                snapPoints={snapPoints}
                postId={bottomSheet.data?.postId}
                onClose={closeBottomSheet}
            />
            <LikeBottomSheet ref={sheetRefs.like} snapPoints={snapPoints} onClose={closeBottomSheet} />
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
