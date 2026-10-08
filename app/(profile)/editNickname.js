import React, { useState, useEffect } from "react";
import { View, Text, Alert } from "react-native";
import { useRouter } from "expo-router";
import EditTextInput from "@src/components/common/EditTextInput";
import TopBar from "@src/components/common/TopBar";
import { VStack, SafeAreaView, Pressable } from "@gluestack-ui/themed";
import { useAuthStore } from "@src/store/authStore";
import { useProfileQuery } from "@src/hooks/queries/useProfileQuery";
import { useUpdateProfileMutation } from "@src/hooks/mutations/useUpdateProfileMutation";

const MainContent = ({ nickname, setNickname }) => {
  return (
    <View className="flex-1 px-6 mt-6">
      <EditTextInput
        className="mb-2"
        label="사용자 이름"
        value={nickname}
        onChangeText={setNickname}
      />
    </View>
  );
};

export default function EditUserNameScreen() {
  const router = useRouter();
  const userId = useAuthStore((state) => state.userId);
  const [nickname, setNickname] = useState("");

  const { data: profileData } = useProfileQuery(userId);
  const updateProfileMutation = useUpdateProfileMutation(userId);

  useEffect(() => {
    if (profileData?.nickname) {
      setNickname(profileData.nickname);
    }
  }, [profileData?.nickname]);

  const handleSaveNickname = () => {
    if (!nickname || nickname.trim() === "") {
      Alert.alert("오류", "닉네임을 입력해주세요.");
      return;
    }

    updateProfileMutation.mutate(
      {
        nickname,
        profileDesc: profileData?.profileDesc ?? "",
      },
      {
        onSuccess: () => {
          router.back();
        },
        onError: () => {
          Alert.alert("오류", "닉네임 업데이트에 실패했습니다.");
        },
      }
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <VStack className="h-full w-full">
        <TopBar
          title="사용자 이름"
          rightComponent={
            <Pressable
              onPress={handleSaveNickname}
              className="flex-1 items-end"
              disabled={!nickname || nickname.trim() === ""}
            >
              <Text
                className={`text-xl font-semibold text-center ${
                  !nickname || nickname.trim() === ""
                    ? "text-gray-400"
                    : "text-blue-500"
                }`}
              >
                완료
              </Text>
            </Pressable>
          }
        />
        <MainContent nickname={nickname} setNickname={setNickname} />
      </VStack>
    </SafeAreaView>
  );
}
