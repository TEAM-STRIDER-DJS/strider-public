import React, { useState, useCallback } from 'react';
import { View, FlatList, RefreshControl } from 'react-native';
import { Spinner } from '@gluestack-ui/themed';
import GridFeedTile from '../../../components/ui/GridFeedTile';

export default function RecommendFeedTab({ posts, isLoading, onRefresh, onPressPost }) {
    const [viewableItems, setViewableItems] = useState([]);

    const onViewableItemsChanged = useCallback(({ viewableItems }) => {
        const indices = viewableItems.map(item => item.item.feedPostId);
        setViewableItems(indices);
    }, []);

    const viewabilityConfig = {
        itemVisiblePercentThreshold: 50
    };

    if (isLoading && (!posts || posts.length === 0)) {
        return (
            <View className="flex-1 justify-center items-center">
                <Spinner size="large" />
            </View>
        );
    }

    return (
        <FlatList
            data={posts || []}
            keyExtractor={(item) => String(item.feedPostId)}
            numColumns={3}
            renderItem={({ item }) => (
                <GridFeedTile
                    item={item}
                    onPressPost={onPressPost}
                    isFocused={viewableItems.includes(item.feedPostId)}
                />
            )}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} />}
            showsVerticalScrollIndicator={false}
        />
    );
}
