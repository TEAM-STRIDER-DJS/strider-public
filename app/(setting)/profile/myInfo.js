import React from "react";
import { View, Text, Alert, Switch } from "react-native";
import { router } from "expo-router";
import AntDesign from "@expo/vector-icons/AntDesign";
import TopBar from "@src/components/common/TopBar";
import {
  VStack,
  SafeAreaView,
  ScrollView,
  Pressable,
} from "@gluestack-ui/themed";
import { useAuthStore } from "@src/store/authStore";
import { useProfileQuery } from "@src/hooks/queries/useProfileQuery";
import { useWithdrawMutation } from "@src/hooks/mutations/useLoginMutation";
import { useUpdateVisibilityMutation } from "@src/hooks/mutations/useUpdateProfileMutation";

const MainContent = () => {
  const { userId } = useAuthStore();
  const { data: userData } = useProfileQuery(userId);
  const { mutate: withdraw, isPending } = useWithdrawMutation();
  const { mutate: updateVisibility, isPending: isUpdatingVisibility } =
    useUpdateVisibilityMutation();

  return (
    <ScrollView className="flex-1 px-6 mt-3">
      <Text className="text-base font-bold text-gray-600 mb-3">내 계정</Text>

      <View className="mb-3 py-3">
        <Text className="text-sm font-bold text-gray-600">아이디</Text>
        <Text className="text-base text-black">{userData?.profileId}</Text>
      </View>

      <Pressable
        className="flex-row justify-between items-center mb-3 py-3"
        onPress={() => router.push("/(setting)/profile/editPassword")}
      >
        <View>
          <Text className="text-sm font-bold text-gray-600">비밀번호</Text>
          <Text className="text-base text-black">**********</Text>
        </View>
        <AntDesign name="right" size={20} color="gray" />
      </Pressable>

      <View className="flex-row justify-between items-center mb-3 py-3">
        <View className="flex-1 mr-3">
          <Text className="text-sm font-bold text-gray-600">비공개 계정</Text>
          <Text className="text-xs text-gray-400 mt-1">
            켜면 팔로우 요청을 수락해야 팔로워가 내 게시물을 볼 수 있어요.
          </Text>
        </View>
        <Switch
          disabled={isUpdatingVisibility}
          value={userData?.isPublic === false}
          onValueChange={(value) => updateVisibility(!value)}
        />
      </View>

      <Pressable
        disabled={isPending}
        className="mt-5"
        onPress={() =>
          Alert.alert(
            "회원 탈퇴",
            "탈퇴 시 계정 정보는 복구할 수 없습니다.\n정말 탈퇴하시겠어요?",
            [
              { text: "취소", style: "cancel" },
              {
                text: "탈퇴",
                style: "destructive",
                onPress: () => withdraw(),
              },
            ],
          )
        }
      >
        <Text className="text-base text-red-500 font-light">
          {isPending ? "처리 중..." : "회원 탈퇴"}
        </Text>
      </Pressable>
    </ScrollView>
  );
};

export default function MyInfoScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <VStack className="h-full w-full">
        <TopBar title="로그인 정보" />
        <MainContent />
      </VStack>
    </SafeAreaView>
  );
}
