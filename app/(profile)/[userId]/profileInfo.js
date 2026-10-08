import React, { useState } from "react";
import { useAuthStore } from "@src/store/authStore";
import ProfileScreen from "@src/components/ui/ProfileScreen";
import { Pressable, Text, View } from "react-native";
import SimpleLineIcons from "@expo/vector-icons/SimpleLineIcons";
import Entypo from "@expo/vector-icons/Entypo";
import { router } from "expo-router";
import { useLocalSearchParams } from "expo-router";
import Button from "@src/components/common/Button";
import { useProfileQuery } from "@src/hooks/queries/useProfileQuery";
import { useUserBlockMutation } from "@src/hooks/mutations/useUserBlockMutation";
import { useUserReportMutation } from "@src/hooks/mutations/useUserReportMutation";

const REPORT_REASONS = [
  { code: "SPAM", label: "스팸 또는 광고" },
  { code: "IMPERSONATION", label: "사칭 또는 허위 계정" },
  { code: "HARASSMENT", label: "괴롭힘 또는 혐오" },
  { code: "INAPPROPRIATE", label: "부적절한 콘텐츠" },
  { code: "FRAUD", label: "사기 또는 피싱" },
  { code: "PRIVACY", label: "개인정보 침해" },
];

export default function ProfilePage() {
  const myUserId = useAuthStore((state) => state.userId);
  const { userId: paramUserId } = useLocalSearchParams();
  const targetUserId = paramUserId ?? myUserId;
  const isMe = myUserId === targetUserId;
  const [showModal, setShowModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const { data, isLoading, error } = useProfileQuery(targetUserId);
  const { mutate: toggleBlock } = useUserBlockMutation();
  const { mutate: reportUser, isLoading: isReporting } =
    useUserReportMutation();

  const handleToggleBlock = () => {
    if (!data?.userId) return;

    toggleBlock({
      targetUserId,
      isBlocked: !!data.isBlock,
    });

    setShowModal(false);
  };

  const handleReport = (reason) => {
    if (!data?.userId) return;

    reportUser(
      {
        targetId: targetUserId,
        reasonCode: reason.code,
        reasonText: reason.label,
      },
      {
        onSuccess: () => {
          setShowReportModal(false);
        },
      },
    );
  };

  return (
    <>
      <ProfileScreen
        userId={targetUserId}
        isMe={isMe}
        showBack={true}
        rightAction={
          isMe ? (
            <Pressable
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              onPress={() => router.push("(setting)/settings")}
            >
              <SimpleLineIcons name="menu" size={18} color="black" />
            </Pressable>
          ) : (
            <Pressable
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              onPress={() => setShowModal(true)}
            >
              <Entypo name="dots-three-horizontal" size={18} color="black" />
            </Pressable>
          )
        }
      />
      {showModal && (
        <>
          <Pressable
            className="absolute inset-0 z-10 bg-black/60"
            onPress={() => setShowModal(false)}
          />
          <View className="absolute bottom-0 left-0 right-0 px-4 pb-6 z-20">
            <View className="bg-primary rounded-md overflow-hidden mb-2">
              <Button
                text={data?.isBlock ? "차단 해제" : "차단"}
                variant="primary"
                size="large"
                onPress={handleToggleBlock}
              />
              <View className="h-px bg-secondary" />
              <Button
                text="신고"
                variant="primary"
                size="large"
                onPress={() => {
                  setShowModal(false);
                  setShowReportModal(true);
                }}
              />
            </View>
            <View className="bg-white rounded-md overflow-hidden">
              <Button
                text="취소"
                variant="white"
                size="large"
                onPress={() => setShowModal(false)}
              />
            </View>
          </View>
        </>
      )}
      {showReportModal && (
        <>
          <Pressable
            className="absolute inset-0 z-10 bg-black/60"
            onPress={() => setShowReportModal(false)}
          />
          <View className="absolute bottom-0 left-0 right-0 px-4 pb-6 z-20">
            <View className="bg-white rounded-xl overflow-hidden border border-black/5">
              <View className="px-5 pt-4 pb-3">
                <View className="h-1 w-10 bg-gray-200 rounded-full self-center mb-3" />
                <Text className="text-lg font-semibold text-black">
                  신고 사유 선택
                </Text>
                <Text className="text-sm text-gray-500 mt-1">
                  가장 가까운 항목을 선택해 주세요.
                </Text>
              </View>
              <View className="border-t border-gray-100" />
              {REPORT_REASONS.map((reason, index) => (
                <Pressable
                  key={reason.code}
                  className={`flex-row items-center justify-between px-5 py-4 ${
                    index < REPORT_REASONS.length - 1
                      ? "border-b border-gray-100"
                      : ""
                  } ${isReporting ? "opacity-50" : ""}`}
                  disabled={isReporting}
                  onPress={() => handleReport(reason)}
                >
                  <View className="flex-row items-center">
                    <View className="h-2 w-2 rounded-full bg-[#6178FD] mr-3" />
                    <Text className="text-base text-black">{reason.label}</Text>
                  </View>
                  <Entypo
                    name="chevron-small-right"
                    size={22}
                    color="#94A3B8"
                  />
                </Pressable>
              ))}
            </View>
            <View className="mt-3">
              <Button
                text="취소"
                variant="white"
                size="large"
                onPress={() => setShowReportModal(false)}
              />
            </View>
          </View>
        </>
      )}
    </>
  );
}
