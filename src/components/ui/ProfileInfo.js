import React, { useState, useEffect } from "react";
import { View, Text } from "react-native";
import {
  VStack,
  HStack,
  Avatar,
  AvatarImage,
  AvatarBadge,
  Pressable,
} from "@gluestack-ui/themed";
import { router } from "expo-router";
import { useAuthStore } from "@src/store/authStore";
import ExpandableText from "@src/components/common/ExpandableText";
import { FollowToggleButton } from "@src/components/ui/FollowToggleButton";
import { useFollowMutation } from "@src/hooks/mutations/useFollowMutation";
import { useCreateDirectRoom } from "@src/hooks/mutations/useChatMutation";

export default function ProfileInfo({ userData, isMe }) {
  const myUserId = useAuthStore((state) => state.userId);
  const { mutate: toggleFollow, isLoading } = useFollowMutation();
  const { mutate: createRoom } = useCreateDirectRoom();
  const [followStatus, setFollowStatus] = useState(userData.followStatus);

  useEffect(() => {
    setFollowStatus(userData.followStatus);
  }, [userData.followStatus]);
  

  const handleToggleFollow = (targetUserId) => {
    const next = (userData.followStatus === "NOT_FOLLOWING" ? true : false)

    setFollowStatus(userData.isPublic === true ? (next ? "FOLLOWING" : "NOT_FOLLOWING") : (next ? "REQUESTED" : "NOT_FOLLOWING"));  

    toggleFollow({
      userId: myUserId,
      targetUserId,
      isFollowed: !next, // optimistic UI 반영을 위해 현재 상태의 반대로 보냄
    });
  };

  return (
    <VStack className="px-5 py-5 w-full">
      <View className="w-full flex-row items-center justify-between">
        <Avatar size="xl" className="mr-8">
          <AvatarImage
            source={
              userData.profileImage
                ? { uri: userData.profileImage }
                : require("@assets/strider-logo.png")
            }
          />
          <AvatarBadge />
        </Avatar>

        <View className="flex-row items-center justify-between flex-1 ml-12">
          <Pressable
            className="items-center"
            onPress={() => router.push(`/(profile)/${userData.userId}/posts`)}
          >
            <Text className="text-black font-semibold text-base">
              {userData.postCount}
            </Text>
            <Text className="text-black text-sm">게시물</Text>
          </Pressable>

          <Pressable
            className="items-center"
            onPress={() =>
              router.push(`/(profile)/${userData.userId}/follow?tabId=follower`)
            }
          >
            <Text className="text-black font-semibold text-base">
              {userData.followerCount}
            </Text>
            <Text className="text-black text-sm">팔로워</Text>
          </Pressable>

          <Pressable
            className="items-center"
            onPress={() =>
              router.push(
                `/(profile)/${userData.userId}/follow?tabId=following`,
              )
            }
          >
            <Text className="text-black font-semibold text-base">
              {userData.followingCount}
            </Text>
            <Text className="text-black text-sm">팔로잉</Text>
          </Pressable>
        </View>
      </View>

      <VStack className="mt-4">
        <Text className="font-semibold text-sm">{userData.nickname}</Text>
        <ExpandableText numberOfLines={1} maxChars={36}>
          {userData.profileDesc}
        </ExpandableText>
      </VStack>

      {!isMe && (
        <HStack className="mt-5">
          <View className="flex-1">
            <FollowToggleButton
              followStatus={followStatus}
              disabled={isLoading}
              onPress={() => handleToggleFollow(userData.userId)}
            />
          </View>
          <Pressable 
            className="flex-1 border border-[#6178FD] rounded-md items-center justify-center ml-2"
            onPress={() => {
              createRoom(userData.userId, {
                onSuccess: (res) => {
                  const roomId = res?.roomId || res?.data?.roomId;
                  if (roomId) {
                    router.push(`/chat/${roomId}`);
                  }
                },
                onError: (err) => {
                  console.error("채팅방 생성 에러:");
                }
              });
            }}
          >
            <Text className="text-[#6178FD]">메시지</Text>
          </Pressable>
        </HStack>
      )}
      {isMe && (
        <View className="w-full mt-6">
          <Pressable
            onPress={() => router.push("/editProfile")}
            className="border border-[#6178FD] bg-white rounded-md justify-center py-2"
          >
            <Text className="text-[#6178FD] text-base text-center">
              프로필 편집
            </Text>
          </Pressable>
        </View>
      )}
    </VStack>
  );
}
