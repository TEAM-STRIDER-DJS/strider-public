import React from "react";
import { Pressable, View, Text, Image } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "@src/store/authStore";
import { FollowToggleButton } from "@src/components/ui/FollowToggleButton";

const FollowCard = ({ data = {}, onToggleFollow = () => {} }) => {
  const router = useRouter();
  const myUserId = useAuthStore((state) => state.userId);
  const isMine = data.userId === myUserId;

  // userId 없거나 자기 자신이면 렌더 안함
  if (!data.userId || isMine) return null;

  const isMutual = data.followStatus === "FOLLOWING" && data.isFollower;
  const hasDesc = !!data.profileDesc;

  return (
    <View className="flex-row items-center px-4 py-3">
      {/* 왼쪽: 프로필 영역 */}
      <Pressable
        className="flex-row items-center flex-[2]"
        onPress={() => router.push(`/(profile)/${data.userId}/profileInfo`)}
      >
        <Image
          source={
            data.profileImage
              ? { uri: data.profileImage }
              : require("@assets/strider-logo.png")
          }
          className="w-14 h-14 rounded-full border border-gray-100"
        />

        <View className="ml-3 flex-1">
          <View className="flex-row items-center">
            <Text className="font-bold text-base">{data.nickname}</Text>
            {isMutual && (
              <>
                <Text className="mx-1 text-gray-400">·</Text>
                <Text className="text-[#6178FD] text-sm">맞팔로우</Text>
              </>
            )}
          </View>

          {hasDesc && (
            <Text
              className="text-gray-600 text-sm"
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {data.profileDesc}
            </Text>
          )}
        </View>
      </Pressable>

      {/* 오른쪽: 팔로우 버튼 (크기 고정) */}
      <View className="flex-[1] justify-center">
        <FollowToggleButton
          followStatus={data.followStatus}
          onPress={() => onToggleFollow(data.userId, (data.followStatus === "NOT_FOLLOWING" ? false : true))}
        />
      </View>
    </View>
  );
};

export default FollowCard;
