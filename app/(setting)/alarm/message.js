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

const SERVICE_TYPE = "MESSAGE";

const SETTING_KEYS = {
  MESSAGE_REQUEST: "MESSAGE_REQUEST",
  MESSAGE_RECEIVE: "MESSAGE_RECEIVE",
  MESSAGE_NOTIFICATION: "MESSAGE_NOTIFICATION",
};

const MainContent = () => {
  const [messageRequestOption, setMessageRequestOption] = useState("ON");
  const [messageReceiveOption, setMessageReceiveOption] = useState("ON");
  const [messageNotificationOption, setMessageNotificationOption] =
    useState("ON");

  const { data, isLoading } = useSettingsQuery({
    serviceType: SERVICE_TYPE,
  });

  const { mutate: updateSetting } = useUpdateSettingsMutation({
    serviceType: SERVICE_TYPE,
  });

  const settingsMap = data?.settings?.MESSAGE || {};

  useEffect(() => {
    setMessageRequestOption(
      settingsMap[SETTING_KEYS.MESSAGE_REQUEST] || "ON",
    );
    setMessageReceiveOption(
      settingsMap[SETTING_KEYS.MESSAGE_RECEIVE] || "ON",
    );
    setMessageNotificationOption(
      settingsMap[SETTING_KEYS.MESSAGE_NOTIFICATION] || "ON",
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
        <Text className="text-md font-bold text-black mb-2">메시지 요청</Text>
        {renderOption("해제", messageRequestOption === "OFF", () =>
          updateSetting(
            {
              settingKey: SETTING_KEYS.MESSAGE_REQUEST,
              settingValue: "OFF",
            },
            {
              onSuccess: () => setMessageRequestOption("OFF"),
            },
          ),
        )}
        {renderOption("설정", messageRequestOption === "ON", () =>
          updateSetting(
            {
              settingKey: SETTING_KEYS.MESSAGE_REQUEST,
              settingValue: "ON",
            },
            {
              onSuccess: () => setMessageRequestOption("ON"),
            },
          ),
        )}
      </View>

      <View className="mb-6">
        <Text className="text-md font-bold text-black mb-2">메시지</Text>
        {renderOption("해제", messageReceiveOption === "OFF", () =>
          updateSetting(
            {
              settingKey: SETTING_KEYS.MESSAGE_RECEIVE,
              settingValue: "OFF",
            },
            {
              onSuccess: () => setMessageReceiveOption("OFF"),
            },
          ),
        )}
        {renderOption("설정", messageReceiveOption === "ON", () =>
          updateSetting(
            {
              settingKey: SETTING_KEYS.MESSAGE_RECEIVE,
              settingValue: "ON",
            },
            {
              onSuccess: () => setMessageReceiveOption("ON"),
            },
          ),
        )}
      </View>

      <View className="mb-6">
        <Text className="text-md font-bold text-black mb-2">메시지 알림</Text>
        {renderOption("해제", messageNotificationOption === "OFF", () =>
          updateSetting(
            {
              settingKey: SETTING_KEYS.MESSAGE_NOTIFICATION,
              settingValue: "OFF",
            },
            {
              onSuccess: () => setMessageNotificationOption("OFF"),
            },
          ),
        )}
        {renderOption("설정", messageNotificationOption === "ON", () =>
          updateSetting(
            {
              settingKey: SETTING_KEYS.MESSAGE_NOTIFICATION,
              settingValue: "ON",
            },
            {
              onSuccess: () => setMessageNotificationOption("ON"),
            },
          ),
        )}
      </View>
    </ScrollView>
  );
};

export default function MessageAlarmSettingScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <VStack className="h-full w-full">
        <TopBar title="알림" />
        <MainContent />
      </VStack>
    </SafeAreaView>
  );
}
