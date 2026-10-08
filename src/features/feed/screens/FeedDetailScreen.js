import React, { useMemo, useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Spinner } from '@gluestack-ui/themed';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pressable } from '@gluestack-ui/themed';

import FeedPostCard from '../components/FeedPostCard';
import CommentBottomSheet from '../components/CommentBottomSheet';
import LikeBottomSheet from '../components/LikeBottomSheet';
import ShareBottomSheet from '../components/ShareBottomSheet';
import ImageViewerModal from '@src/components/ui/ImageViewerModal';
import { useFeedDetail, useFollowFeeds, useRecommendFeeds } from '@src/hooks/queries/useFeedQuery';
import { useUiStore } from '@src/store/uiStore';
import { useFeedStore } from '@src/store/feedStore';
import { useSharedBottomSheet } from '../hooks/useSharedBottomSheet';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function FeedDetailScreen() {
    const { postId, source } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    // 헤더 높이 (SafeArea top + content height)
    const headerHeight = 50; // 대략적인 헤더 콘텐츠 높이
    const itemHeight = SCREEN_HEIGHT - insets.top - insets.bottom - headerHeight;

    const { data: curPostData, isLoading: isDetailLoading } = useFeedDetail(postId);
    const { data: followPosts } = useFollowFeeds();
    const { data: recommendPosts } = useRecommendFeeds();

    const { feeds, updateFeedDetail, setFeeds } = useFeedStore();

    // 상세 데이터 스토어 업데이트
    useEffect(() => {
        if (curPostData) {
            updateFeedDetail(curPostData);
        }
    }, [curPostData, updateFeedDetail]);

    // 데이터 소스 결정 및 조합
    const posts = useMemo(() => {
        let baseList = [];

        if (source === 'recommend') {
            baseList = recommendPosts || [];
        } else {
            // home or default
            // 스토어 우선 사용
            if (feeds && feeds.length > 0) baseList = feeds;
            else baseList = followPosts || [];
        }

        // 현재 포스트가 리스트에 없으면 추가 (단일 조회 데이터 활용)
        const exists = baseList.find(p => String(p.feedPostId) === String(postId));
        if (!exists && curPostData) {
            return [curPostData, ...baseList];
        }

        // 선택된 포스트가 맨 위에 오도록 정렬하거나, 그냥 리스트 그대로 보여주고 initialScrollIndex 사용
        // 여기서는 "선택된 포스트부터 시작" 하는 느낌을 주기 위해 필터링 후 재배치
        if (exists) {
            const others = baseList.filter(p => String(p.feedPostId) !== String(postId));
            return [exists, ...others];
        }

        return baseList;
    }, [source, recommendPosts, followPosts, feeds, postId, curPostData]);

    const { bottomSheet, closeBottomSheet, openImageViewer } = useUiStore();
    const { snapPoints, renderBackdrop, sheetRefs } = useSharedBottomSheet();

    const handleImagePress = (feedData, index) => {
        openImageViewer(feedData.mediaList, index);
    };

    useEffect(() => {
        closeBottomSheet();
    }, [postId, closeBottomSheet]);

    // 수직 스크롤 포커스 관리
    const [viewableIndex, setViewableIndex] = useState(0);

    const onViewableItemsChanged = useRef(({ viewableItems }) => {
        if (viewableItems && viewableItems.length > 0) {
            setViewableIndex(viewableItems[0].index);
        }
    }).current;

    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 80
    }).current;

    if (isDetailLoading && (!posts || posts.length === 0)) {
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
                    {source === 'recommend' ? '추천 게시물' : '게시물'}
                </Text>
                <View style={{ width: 32 }} />
            </View>

            <FlatList
                data={posts}
                keyExtractor={(item) => String(item.feedPostId)}
                renderItem={({ item, index }) => (
                    <View style={{ height: itemHeight, justifyContent: 'center', backgroundColor: 'black' }}>
                        <FeedPostCard
                            data={item}
                            onImagePress={handleImagePress}
                            onPress={() => { }}
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
                getItemLayout={(data, index) => (
                    { length: itemHeight, offset: itemHeight * index, index }
                )}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
            />

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
