import React, { useState, useMemo } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { HStack, Pressable } from "@gluestack-ui/themed";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import AntDesign from "@expo/vector-icons/AntDesign";
import { useRouter } from "expo-router";
import CalendarWithFeeds from "@src/components/ui/CalendarWithFeeds";
import GridFeedTile from "@src/components/ui/GridFeedTile";
import { useProfileFeeds } from "@src/hooks/queries/useFeedQuery";
import { toDateKey } from "@src/utils/date";

export default function ProfileTabs({ userId, isMe }) {
  const [activeTab, setActiveTab] = useState("feed");

  return (
    <View className="w-full">
      <HStack className="border-b border-gray-200">
        <TabButton
          active={activeTab === "feed"}
          onPress={() => setActiveTab("feed")}
        >
          <MaterialIcons name="grid-on" size={24} />
        </TabButton>

        <TabButton
          active={activeTab === "calendar"}
          onPress={() => setActiveTab("calendar")}
        >
          <AntDesign name="calendar" size={24} />
        </TabButton>
      </HStack>

      {activeTab === "feed" && <FeedGrid userId={userId} isMe={isMe} />}
      {activeTab === "calendar" && <FeedCalendar userId={userId} isMe={isMe} />}
    </View>
  );
}

const TabButton = ({ active, onPress, children }) => (
  <Pressable
    onPress={onPress}
    className={`flex-1 h-12 items-center justify-center ${
      active ? "border-b-2 border-black" : ""
    }`}
  >
    {children}
  </Pressable>
);

const FeedGrid = ({ userId, isMe }) => {
  const router = useRouter();
  const { data: feeds, isLoading, error } = useProfileFeeds(userId, isMe);

  const handlePressPost = (feedPostId) => {
    router.push({
      pathname: `/feed/${feedPostId}`,
      params: { source: "profile" },
    });
  };

  if (isLoading) {
    return (
      <View className="py-10 items-center justify-center">
        <ActivityIndicator size="large" color="#6178FD" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="py-10 items-center justify-center">
        <Text className="text-gray-400 text-sm">피드를 불러오지 못했어요.</Text>
      </View>
    );
  }

  if (!feeds || feeds.length === 0) {
    return (
      <View className="py-16 items-center justify-center">
        <MaterialIcons name="photo-library" size={40} color="#D1D5DB" />
        <Text className="text-gray-400 text-sm mt-3">아직 게시물이 없어요.</Text>
      </View>
    );
  }

  return (
    <View className="flex-row flex-wrap">
      {feeds.map((item) => (
        <GridFeedTile
          key={String(item.feedPostId)}
          item={item}
          onPressPost={handlePressPost}
          isFocused={false}
        />
      ))}
    </View>
  );
};

const FeedCalendar = ({ userId, isMe }) => {
  const router = useRouter();
  const { data: feeds } = useProfileFeeds(userId, isMe);

  // 날짜별 피드 매핑 (같은 날 여러 개면 최신 1개 썸네일)
  const feedsByDate = useMemo(() => {
    const map = {};
    (feeds ?? []).forEach((f) => {
      const key = toDateKey(f.createdAt);
      if (key && !map[key]) {
        const m = f.mediaList?.[0];
        const isVideo = m?.mediaType === 'VIDEO';
        map[key] = {
          // 영상은 fileUrl(mp4)을 못 그리므로 thumbnailUrl 사용, 사진은 원본(fileUrl) 우선
          thumbnail: isVideo ? (m?.thumbnailUrl || m?.fileUrl) : (m?.fileUrl || m?.thumbnailUrl),
          feedPostId: f.feedPostId,
        };
      }
    });
    return map;
  }, [feeds]);

  return (
    <CalendarWithFeeds
      feedsByDate={feedsByDate}
      onDayFeedPress={(feed, dateKey) =>
        router.push({
          pathname: `/(profile)/${userId}/posts`,
          params: { date: dateKey, postId: feed.feedPostId },
        })
      }
    />
  );
};
