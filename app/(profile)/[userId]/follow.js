import React, { useState } from "react";
import { useAuthStore } from "@src/store/authStore";
import { Text, FlatList, ActivityIndicator, View } from "react-native";
import { VStack, SafeAreaView, HStack, Pressable } from "@gluestack-ui/themed";
import { useLocalSearchParams } from "expo-router";

import TopBar from "@src/components/common/TopBar";
import FollowCard from "@src/components/ui/FollowCard";

import { useFollowMutation } from "@src/hooks/mutations/useFollowMutation";
import { useProfileQuery } from "@src/hooks/queries/useProfileQuery";
import { useFollowQuery } from "@src/hooks/queries/useFollowQuery";

export default function MyFollowScreen() {
  const myUserId = useAuthStore((state) => state.userId);
  const { userId, tabId } = useLocalSearchParams();

  /** 초기 탭 (앞 화면 파라미터 기반) */
  const [activeTab, setActiveTab] = useState(
    tabId === "following" ? "following" : "follower",
  );

  /** 프로필 정보 */
  const { data: profileData } = useProfileQuery(userId);

  /** follower / following 리스트 (각각 캐싱 유지) */
  const { data: followerList = [], isLoading: followerLoading } =
    useFollowQuery({
      userId,
      type: "follower",
    });

  const { data: followingList = [], isLoading: followingLoading } =
    useFollowQuery({
      userId,
      type: "following",
    });

  /** 현재 탭 기준 데이터 */
  const list = activeTab === "follower" ? followerList : followingList;
  const isLoading =
    activeTab === "follower" ? followerLoading : followingLoading;

  /** 팔로우가 하나라도 있는지 (0일 때 로딩 스킵) */
  const hasAnyFollow =
    (profileData?.followerCount ?? 0) > 0 ||
    (profileData?.followingCount ?? 0) > 0;

  const { mutate: toggleFollow } = useFollowMutation();

  const handleToggleFollow = (targetUserId, isCurrentlyFollowing) => {
    toggleFollow({
      userId: myUserId,
      targetUserId,
      isFollowed: isCurrentlyFollowing,
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <VStack className="flex-1">
        <TopBar title={profileData?.nickname ?? ""} />

        {/* 탭 영역 */}
        <HStack className="border-b border-gray-200 relative">
          <Pressable
            className="flex-1 items-center py-3"
            onPress={() => {
              if (activeTab !== "follower") {
                setActiveTab("follower");
              }
            }}
          >
            <Text
              className={`font-semibold ${
                activeTab === "follower" ? "text-black" : "text-gray-400"
              }`}
            >
              팔로워
            </Text>
            <Text
              className={`${
                activeTab === "follower" ? "text-black" : "text-gray-400"
              }`}
            >
              {profileData?.followerCount ?? 0}
            </Text>

            {activeTab === "follower" && (
              <HStack className="absolute bottom-0 left-0 h-0.5 w-full bg-black" />
            )}
          </Pressable>

          <Pressable
            className="flex-1 items-center py-3"
            onPress={() => {
              if (activeTab !== "following") {
                setActiveTab("following");
              }
            }}
          >
            <Text
              className={`font-semibold ${
                activeTab === "following" ? "text-black" : "text-gray-400"
              }`}
            >
              팔로잉
            </Text>
            <Text
              className={`${
                activeTab === "following" ? "text-black" : "text-gray-400"
              }`}
            >
              {profileData?.followingCount ?? 0}
            </Text>

            {activeTab === "following" && (
              <HStack className="absolute bottom-0 left-0 h-0.5 w-full bg-black" />
            )}
          </Pressable>
        </HStack>

        {/* 리스트 영역 */}
        {isLoading && hasAnyFollow ? (
          <ActivityIndicator className="mt-10" />
        ) : (
          <FlatList
            data={list ?? []}
            keyExtractor={(item, index) => item?.userId ?? index.toString()}
            renderItem={({ item }) =>
              item ? (
                <FollowCard data={item} onToggleFollow={handleToggleFollow} />
              ) : null
            }
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <Text className="text-center text-gray-500 mt-10">
                {activeTab === "following"
                  ? "팔로잉한 사용자가 없습니다."
                  : "팔로워가 없습니다."}
              </Text>
            }
            ListFooterComponent={<View style={{ height: 64 }} />}
          />
        )}
      </VStack>
    </SafeAreaView>
  );
}
