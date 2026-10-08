import React, { useEffect, useRef, useState } from "react";
import { View, Text, Switch, Vibration } from "react-native";
import {
  VStack,
  SafeAreaView,
  ScrollView,
  Pressable,
} from "@gluestack-ui/themed";
import { createAudioPlayer, setAudioModeAsync } from "expo-audio";

import TopBar from "@src/components/common/TopBar";
import { useSettingsQuery } from "@src/hooks/queries/useSettingsQuery";
import { useUpdateSettingsMutation } from "@src/hooks/mutations/useUpdateSettingsMutation";
import {
  SOUND_SERVICE_TYPE,
  SOUND_BACKEND_ENABLED,
  SOUND_KEYS,
  SOUND_OPTIONS,
  readLocalSound,
  writeLocalSound,
} from "@src/config/soundOptions";

const MainContent = () => {
  // 초기값은 기기에 저장된 로컬 값(없으면 기본값)
  const [enabled, setEnabled] = useState(() =>
    readLocalSound(SOUND_KEYS.ENABLED),
  );
  const [vibration, setVibration] = useState(() =>
    readLocalSound(SOUND_KEYS.VIBRATION),
  );
  const [tone, setTone] = useState(() => readLocalSound(SOUND_KEYS.TONE));

  const { data } = useSettingsQuery({
    serviceType: SOUND_BACKEND_ENABLED ? SOUND_SERVICE_TYPE : undefined,
  });
  const { mutate: updateSetting } = useUpdateSettingsMutation({
    serviceType: SOUND_SERVICE_TYPE,
  });

  // 서버가 SOUND 값을 내려줄 때만 그 값으로 덮어씀
  // (백엔드 미구현 상태에서는 로컬 값을 그대로 유지)
  useEffect(() => {
    const map = data?.settings?.[SOUND_SERVICE_TYPE];
    if (!map) return;
    if (map[SOUND_KEYS.ENABLED] != null) setEnabled(map[SOUND_KEYS.ENABLED]);
    if (map[SOUND_KEYS.VIBRATION] != null)
      setVibration(map[SOUND_KEYS.VIBRATION]);
    if (map[SOUND_KEYS.TONE] != null) setTone(map[SOUND_KEYS.TONE]);
  }, [data]);

  // 미리듣기 플레이어 (탭마다 새로 생성하고 직전 것은 해제)
  const playerRef = useRef(null);
  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
    return () => playerRef.current?.remove();
  }, []);

  const playPreview = (asset) => {
    if (!asset) return;
    try {
      playerRef.current?.remove();
      const player = createAudioPlayer(asset);
      playerRef.current = player;
      player.play();
    } catch (e) {
      console.warn("알림음 미리듣기 실패:");
    }
  };

  // 공통: 즉시 반영 + 로컬 저장 + 서버 반영(best-effort)
  // 백엔드 SOUND 미구현 시 updateSetting 은 실패하지만 로컬 값은 유지됨
  const patch = (settingKey, settingValue, applyLocal) => {
    applyLocal(settingValue);
    writeLocalSound(settingKey, settingValue);
    if (SOUND_BACKEND_ENABLED) updateSetting({ settingKey, settingValue });
  };

  const toggleEnabled = (value) => {
    const v = value ? "ON" : "OFF";
    patch(SOUND_KEYS.ENABLED, v, setEnabled);
  };

  const toggleVibration = (value) => {
    const v = value ? "ON" : "OFF";
    patch(SOUND_KEYS.VIBRATION, v, setVibration);
    if (value) Vibration.vibrate(200); // 미리 진동
  };

  const selectTone = (option) => {
    if (enabled !== "ON") return;
    patch(SOUND_KEYS.TONE, option.key, setTone);
    playPreview(option.asset);
  };

  const soundOff = enabled !== "ON";

  return (
    <ScrollView className="flex-1 px-5 mt-3">
      {/* 알림 방식 */}
      <View className="mb-8">
        <Text className="text-base font-bold text-gray-500 mb-4">알림 방식</Text>

        <View className="flex-row items-center justify-between py-3">
          <Text className="text-base text-black">알림음</Text>
          <Switch
            value={enabled === "ON"}
            onValueChange={toggleEnabled}
            trackColor={{ false: "#E5E7EB", true: "#6178FD" }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View className="flex-row items-center justify-between py-3">
          <Text className="text-base text-black">진동</Text>
          <Switch
            value={vibration === "ON"}
            onValueChange={toggleVibration}
            trackColor={{ false: "#E5E7EB", true: "#6178FD" }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>

      {/* 알림음 종류 */}
      <View className="mb-8" style={{ opacity: soundOff ? 0.4 : 1 }}>
        <Text className="text-base font-bold text-gray-500 mb-4">
          알림음 종류
        </Text>

        {SOUND_OPTIONS.map((option) => {
          const selected = tone === option.key;
          return (
            <Pressable
              key={option.key}
              disabled={soundOff}
              onPress={() => selectTone(option)}
              className="flex-row justify-between items-center py-3"
            >
              <Text className="text-base text-black">{option.label}</Text>
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  borderWidth: 2,
                  borderColor: selected ? "#6178FD" : "#C4C9D1",
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
                      backgroundColor: "#6178FD",
                    }}
                  />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
};

export default function NotificationSoundScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <VStack className="flex-1">
        <TopBar title="알림음 설정" />
        <MainContent />
      </VStack>
    </SafeAreaView>
  );
}
