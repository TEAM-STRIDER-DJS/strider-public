import React from "react";
import { View, Text } from "react-native";
import {
  VStack,
  SafeAreaView,
  HStack,
  ScrollView,
  Pressable,
} from "@gluestack-ui/themed";
import AntDesign from "@expo/vector-icons/AntDesign";
import Feather from "@expo/vector-icons/Feather";
import { router } from "expo-router";

import TopBar from "@src/components/common/TopBar";

/* ------------------ 설정 데이터 ------------------ */
const settings = [
  {
    section: "일반",
    items: [
      {
        icon: "volume-2",
        label: "알림음 설정",
        route: "/(setting)/alarm/notificationSound",
      },
    ],
  },
  {
    section: "서비스별",
    items: [
      {
        icon: "image",
        label: "피드",
        route: "/(setting)/alarm/feedComment",
      },
      {
        icon: "message-circle",
        label: "메시지",
        route: "/(setting)/alarm/message",
      },
    ],
  },
];

/* ------------------ 메인 콘텐츠 ------------------ */
const MainContent = () => {
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
              onPress={() => item.route && router.push(item.route)}
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
    </ScrollView>
  );
};

/* ------------------ 화면 ------------------ */
export default function NotificationSettingsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <VStack className="flex-1">
        <TopBar title="알림 수신 설정" />
        <MainContent />
      </VStack>
    </SafeAreaView>
  );
}
