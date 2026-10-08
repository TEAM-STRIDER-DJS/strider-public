import React, { useState } from "react";
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

const SERVICE_TYPE = "FEED";

const SETTING_KEYS = {
  FEED_LIKE: "FEED_LIKE",
  FEED_COMMENT: "FEED_COMMENT",
  FEED_COMMENT_LIKE: "FEED_COMMENT_LIKE",
  FEED_RECOMMENDATION: "FEED_RECOMMENDATION",
};

const MainContent = () => {
  const [likeOption, setLikeOption] = useState("ALL");
  const [commentOption, setCommentOption] = useState("ALL");
  const [commentLikeOption, setCommentLikeOption] = useState("ON");
  const [recommendedPostOption, setRecommendedPostOption] = useState("ON");

  const { data } = useSettingsQuery({
    serviceType: SERVICE_TYPE,
  });

  React.useEffect(() => {
    const settingsMap = data?.settings?.FEED || {};

    setLikeOption(settingsMap[SETTING_KEYS.FEED_LIKE] || "ALL");
    setCommentOption(
      settingsMap[SETTING_KEYS.FEED_COMMENT] || "ALL",
    );
    setCommentLikeOption(
      settingsMap[SETTING_KEYS.FEED_COMMENT_LIKE] || "ON",
    );
    setRecommendedPostOption(
      settingsMap[SETTING_KEYS.FEED_RECOMMENDATION] || "ON",
    );
  }, [data]);

  /** 설정 변경 */
  const { mutate: updateSetting } = useUpdateSettingsMutation({
    serviceType: SERVICE_TYPE,
  });

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

  return (
    <ScrollView className="flex-1 px-6 mt-3 bg-white">
      {/* 좋아요 */}
      <View className="mb-6">
        <Text className="text-md font-bold text-black mb-2">좋아요</Text>
        {renderOption("해제", likeOption === "OFF", () =>
          updateSetting(
            {
              settingKey: SETTING_KEYS.FEED_LIKE,
              settingValue: "OFF",
            },
            { onSuccess: () => setLikeOption("OFF") },
          ),
        )}
        {renderOption(
          "내가 팔로우하는 프로필",
          likeOption === "FOLLOWING",
          () =>
            updateSetting(
              {
                settingKey: SETTING_KEYS.FEED_LIKE,
                settingValue: "FOLLOWING",
              },
              { onSuccess: () => setLikeOption("FOLLOWING") },
            ),
        )}
        {renderOption("모든 사람", likeOption === "ALL", () =>
          updateSetting(
            {
              settingKey: SETTING_KEYS.FEED_LIKE,
              settingValue: "ALL",
            },
            { onSuccess: () => setLikeOption("ALL") },
          ),
        )}
      </View>

      {/* 댓글 */}
      <View className="mb-6">
        <Text className="text-md font-bold text-black mb-2">댓글</Text>
        {renderOption("해제", commentOption === "OFF", () =>
          updateSetting(
            {
              settingKey: SETTING_KEYS.FEED_COMMENT,
              settingValue: "OFF",
            },
            { onSuccess: () => setCommentOption("OFF") },
          ),
        )}
        {renderOption(
          "내가 팔로우하는 프로필",
          commentOption === "FOLLOWING",
          () =>
            updateSetting(
              {
                settingKey: SETTING_KEYS.FEED_COMMENT,
                settingValue: "FOLLOWING",
              },
              { onSuccess: () => setCommentOption("FOLLOWING") },
            ),
        )}
        {renderOption("모든 사람", commentOption === "ALL", () =>
          updateSetting(
            {
              settingKey: SETTING_KEYS.FEED_COMMENT,
              settingValue: "ALL",
            },
            { onSuccess: () => setCommentOption("ALL") },
          ),
        )}
      </View>

      {/* 댓글 좋아요 */}
      <View className="mb-6">
        <Text className="text-md font-bold text-black mb-2">댓글 좋아요</Text>
        {renderOption("해제", commentLikeOption === "OFF", () =>
          updateSetting(
            {
              settingKey: SETTING_KEYS.FEED_COMMENT_LIKE,
              settingValue: "OFF",
            },
            { onSuccess: () => setCommentLikeOption("OFF") },
          ),
        )}
        {renderOption("설정", commentLikeOption === "ON", () =>
          updateSetting(
            {
              settingKey: SETTING_KEYS.FEED_COMMENT_LIKE,
              settingValue: "ON",
            },
            { onSuccess: () => setCommentLikeOption("ON") },
          ),
        )}
      </View>

      {/* 추천 게시물 */}
      <View className="mb-6">
        <Text className="text-md font-bold text-black mb-2">
          회원님을 위한 추천 게시물
        </Text>
        {renderOption("해제", recommendedPostOption === "OFF", () =>
          updateSetting(
            {
              settingKey: SETTING_KEYS.FEED_RECOMMENDATION,
              settingValue: "OFF",
            },
            { onSuccess: () => setRecommendedPostOption("OFF") },
          ),
        )}
        {renderOption("설정", recommendedPostOption === "ON", () =>
          updateSetting(
            {
              settingKey: SETTING_KEYS.FEED_RECOMMENDATION,
              settingValue: "ON",
            },
            { onSuccess: () => setRecommendedPostOption("ON") },
          ),
        )}
      </View>
    </ScrollView>
  );
};

export default function AlarmFeedCommentScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <VStack className="h-full w-full">
        <TopBar title="알림" />
        <MainContent />
      </VStack>
    </SafeAreaView>
  );
}
