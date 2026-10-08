import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import TopBar from "@src/components/common/TopBar";
import { VStack, SafeAreaView, Pressable } from "@gluestack-ui/themed";
import { useAuthStore } from "@src/store/authStore";
import { useProfileQuery } from "@src/hooks/queries/useProfileQuery";
import { useUpdateProfileMutation } from "@src/hooks/mutations/useUpdateProfileMutation";

// 메인 Content
const MainContent = ({ profileDesc, setProfileDesc }) => {
  const maxLength = 200;
  const remaining = maxLength - profileDesc.length;

  return (
    <View className="flex-1 px-6 mt-6">
      <View className="flex-1">
        <TextInput
          multiline
          value={profileDesc}
          onChangeText={setProfileDesc}
          placeholder="프로필 소개를 입력하세요"
          className="text-black text-base border border-gray-300 rounded-xl px-3 pt-3 pb-3"
          style={{ textAlignVertical: "top", flex: 1 }}
          maxLength={maxLength * 2}
        />
      </View>
      <Text
        className={`text-right mt-2 text-sm ${
          remaining >= 0 ? "text-gray-500" : "text-red-500"
        }`}
      >
        {remaining >= 0
          ? `남은 글자수: ${remaining}`
          : `초과 글자수: ${remaining}`}
      </Text>
    </View>
  );
};

export default function EditUserNameScreen() {
  const router = useRouter();

  const userId = useAuthStore((state) => state.userId);
  const { data: profileData } = useProfileQuery(userId);
  const updateProfileMutation = useUpdateProfileMutation();

  const [profileDesc, setProfileDesc] = useState("");

  useEffect(() => {
    if (profileData?.profileDesc) {
      setProfileDesc(profileData.profileDesc);
    }
  }, [profileData?.profileDesc]);

  const isValid = profileDesc.length <= 200;

  // 완료 버튼 클릭 시 API 호출
  const handleSave = () => {
    if (!isValid) return;

    updateProfileMutation.mutate(
      {
        nickname: profileData?.nickname ?? "",
        profileDesc,
      },
      {
        onSuccess: () => {
          router.back();
        },
      }
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={50}
      >
        <VStack className="h-full w-full">
          <TopBar
            title="소개"
            rightComponent={
              <Pressable
                disabled={!isValid}
                onPress={handleSave}
                className="flex-1 items-end"
              >
                <Text
                  className={`text-xl font-semibold text-center ${
                    isValid ? "text-blue-500" : "text-gray-400"
                  }`}
                >
                  완료
                </Text>
              </Pressable>
            }
          />
          <MainContent
            profileDesc={profileDesc}
            setProfileDesc={setProfileDesc}
          />
        </VStack>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
