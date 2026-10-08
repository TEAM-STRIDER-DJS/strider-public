import React from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { VStack, SafeAreaView, ScrollView } from "@gluestack-ui/themed";
import TopBar from "@src/components/common/TopBar";

import ProfileInfo from "./ProfileInfo";
import ProfileTabs from "./ProfileTabs";
import { useProfileQuery } from "@src/hooks/queries/useProfileQuery";

export default function ProfileScreen({ userId, isMe, rightAction, showBack }) {
  const { data, isLoading, error } = useProfileQuery(userId);

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#6178FD" />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>프로필 정보를 불러올 수 없습니다.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <VStack className="flex-1">
        <TopBar
          title={data.nickname}
          showBack={showBack !== undefined ? showBack : !isMe}
          rightComponent={rightAction}
        />

        <ScrollView showsVerticalScrollIndicator={false}>
          <VStack>
            <ProfileInfo userData={data} isMe={isMe} />
            <ProfileTabs userId={userId} isMe={isMe} />
          </VStack>
        </ScrollView>
      </VStack>
    </SafeAreaView>
  );
}
