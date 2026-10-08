import React, { useState, useEffect } from "react";
import { View, Text } from "react-native";
import TopBar from "@src/components/common/TopBar";
import {
  VStack,
  SafeAreaView,
  ScrollView,
  Pressable,
} from "@gluestack-ui/themed";

import { useSettingsQuery } from "@src/hooks/queries/useSettingsQuery";
import { useUpdateSettingsMutation } from "@src/hooks/mutations/useUpdateSettingsMutation";

const SERVICE_TYPE = "FOLLOW";

const SETTING_KEYS = {
  FOLLOW_REQUEST: "FOLLOW_REQUEST",
  FOLLOW_ACCEPTED: "FOLLOW_ACCEPTED",
  FOLLOW_SUGGESTION: "FOLLOW_SUGGESTION",
};

const MainContent = () => {
  const [followRequestOption, setFollowRequestOption] = useState("ON");
  const [followAcceptedOption, setFollowAcceptedOption] = useState("ON");
  const [followSuggestionOption, setFollowSuggestionOption] = useState("ON");

  const { data, isLoading } = useSettingsQuery({
    serviceType: SERVICE_TYPE,
  });

  const { mutate: updateSetting } = useUpdateSettingsMutation({
    serviceType: SERVICE_TYPE,
  });

  const settingsMap = data?.settings?.FOLLOW || {};

  useEffect(() => {
    setFollowRequestOption(settingsMap[SETTING_KEYS.FOLLOW_REQUEST] || "ON");
    setFollowAcceptedOption(
      settingsMap[SETTING_KEYS.FOLLOW_ACCEPTED] || "ON",
    );
    setFollowSuggestionOption(
      settingsMap[SETTING_KEYS.FOLLOW_SUGGESTION] || "ON",
    );
  }, [data]);

  const renderOption = (label, selected, onPress) => (
    <Pressable
      onPress={onPress}
      className="flex-row justify-between items-center py-3"
    >
      <Text className="text-base text-black">{label}</Text>
      <View
        style={{
          width: 20,
          height: 20,
          borderRadius: 10,
          borderWidth: 2,
          borderColor: "#333",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {selected && (
          <View
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: "#333",
            }}
          />
        )}
      </View>
    </Pressable>
  );

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>로딩 중...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 px-6 mt-3 bg-white">
      <View className="mb-6">
        <Text className="text-md font-bold text-black mb-2">팔로워 요청</Text>
        {renderOption("해제", followRequestOption === "OFF", () =>
          updateSetting(
            {
              settingKey: SETTING_KEYS.FOLLOW_REQUEST,
              settingValue: "OFF",
            },
            {
              onSuccess: () => setFollowRequestOption("OFF"),
            },
          ),
        )}
        {renderOption("설정", followRequestOption === "ON", () =>
          updateSetting(
            {
              settingKey: SETTING_KEYS.FOLLOW_REQUEST,
              settingValue: "ON",
            },
            {
              onSuccess: () => setFollowRequestOption("ON"),
            },
          ),
        )}
      </View>

      <View className="mb-6">
        <Text className="text-md font-bold text-black mb-2">
          수락한 팔로우 요청
        </Text>
        {renderOption("해제", followAcceptedOption === "OFF", () =>
          updateSetting(
            {
              settingKey: SETTING_KEYS.FOLLOW_ACCEPTED,
              settingValue: "OFF",
            },
            {
              onSuccess: () => setFollowAcceptedOption("OFF"),
            },
          ),
        )}
        {renderOption("설정", followAcceptedOption === "ON", () =>
          updateSetting(
            {
              settingKey: SETTING_KEYS.FOLLOW_ACCEPTED,
              settingValue: "ON",
            },
            {
              onSuccess: () => setFollowAcceptedOption("ON"),
            },
          ),
        )}
      </View>

      <View className="mb-6">
        <Text className="text-md font-bold text-black mb-2">계정 추천</Text>
        {renderOption("해제", followSuggestionOption === "OFF", () =>
          updateSetting(
            {
              settingKey: SETTING_KEYS.FOLLOW_SUGGESTION,
              settingValue: "OFF",
            },
            {
              onSuccess: () => setFollowSuggestionOption("OFF"),
            },
          ),
        )}
        {renderOption("설정", followSuggestionOption === "ON", () =>
          updateSetting(
            {
              settingKey: SETTING_KEYS.FOLLOW_SUGGESTION,
              settingValue: "ON",
            },
            {
              onSuccess: () => setFollowSuggestionOption("ON"),
            },
          ),
        )}
      </View>
    </ScrollView>
  );
};

export default function FollowAlarmSettingScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <VStack className="h-full w-full">
        <TopBar title="알림" />
        <MainContent />
      </VStack>
    </SafeAreaView>
  );
}
