import React from "react";
import { View, Text, Alert } from "react-native";
import { router } from "expo-router";
import AntDesign from "@expo/vector-icons/AntDesign";
import Feather from "@expo/vector-icons/Feather";

import TopBar from "@src/components/common/TopBar";
import { useLogoutMutation } from "@src/hooks/mutations/useLoginMutation";

import {
  VStack,
  SafeAreaView,
  HStack,
  ScrollView,
  Pressable,
} from "@gluestack-ui/themed";

/* ------------------ 설정 데이터 ------------------ */
const settings = [
  {
    section: "일반",
    items: [
      {
        icon: "user",
        label: "내 정보 수정",
        route: "/(setting)/profile/myInfo",
      },
      {
        icon: "bookmark",
        label: "저장됨",
        route: "/(setting)/bookmark/bookmark",
      },
      {
        icon: "bell",
        label: "알림 설정",
        route: "/(setting)/alarm/notificationSettings",
      },
    ],
  },
  {
    section: "정보",
    items: [
      {
        icon: "file-text",
        label: "이용약관",
        route: "/(setting)/policy/terms",
      },
      {
        icon: "lock",
        label: "개인정보처리방침",
        route: "/(setting)/policy/privacy",
      },
    ],
  },
];

/* ------------------ 메인 콘텐츠 ------------------ */
const MainContent = () => {
  const { mutate: logout } = useLogoutMutation();

  const handleLogout = () => {
    Alert.alert("로그아웃", "정말 로그아웃 하시겠어요?", [
      { text: "취소", style: "cancel" },
      {
        text: "로그아웃",
        style: "destructive",
        onPress: () => {
          logout(undefined, {
            onSuccess: () => {
              router.replace("/(onboarding)/welcome");
            },
            onError: () => {
              Alert.alert("로그아웃 실패", "다시 시도해 주세요.");
            },
          });
        },
      },
    ]);
  };

  return (
    <ScrollView className="flex-1 px-5 mt-3">
      {settings.map((section, idx) => (
        <View key={idx} className="mb-8">
          <Text className="text-base font-bold text-gray-500 mb-4">
            {section.section}
          </Text>

          {section.items.map((item, index) => (
            <Pressable
              key={index}
              className="flex-row items-center justify-between py-4"
              onPress={() => router.push(item.route)}
            >
              <HStack className="items-center">
                <Feather name={item.icon} size={20} color="black" />
                <Text className="text-base text-black ml-3">{item.label}</Text>
              </HStack>

              <AntDesign name="right" size={16} color="gray" />
            </Pressable>
          ))}
        </View>
      ))}

      {/* 로그아웃 */}
      <Pressable className="mt-2 mb-6" onPress={handleLogout}>
        <Text className="text-red-500 text-base font-semibold">로그아웃</Text>
      </Pressable>

      {/* 버전 */}
      <Text className="text-xs text-gray-400">버전 1.0.0 (25.07.13.01)</Text>
    </ScrollView>
  );
};

/* ------------------ 화면 ------------------ */
export default function SettingScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <VStack className="flex-1">
        <TopBar title="설정" />
        <MainContent />
      </VStack>
    </SafeAreaView>
  );
}
