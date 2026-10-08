import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  Modal,
  Image,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "@gluestack-ui/themed";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import dayjs from "dayjs";
import "dayjs/locale/ko";

import TopBar from "@src/components/common/TopBar";
import { useNotificationsQuery } from "@src/hooks/queries/useNotificationQuery";
import {
  useDeleteAllNotificationsMutation,
  useMarkNotificationReadMutation,
} from "@src/hooks/mutations/useNotificationMutation";
import { useFollowRequestMutation } from "@src/hooks/mutations/useFollowRequestMutation";
import {
  NOTIFICATION_TABS as TABS,
  matchesTab,
  isFeedType,
  getNotificationRoute,
} from "@src/config/notificationTabs";

dayjs.locale("ko");

const formatNotificationTime = (dateStr) => {
  const now = dayjs();
  const date = dayjs(dateStr);

  if (now.isSame(date, "day")) {
    return date.format("a h:mm");
  }
  if (now.subtract(1, "day").isSame(date, "day")) {
    return `어제 ${date.format("a h:mm")}`;
  }
  if (now.diff(date, "day") < 7) {
    const days = ["일", "월", "화", "수", "목", "금", "토"];
    return `${days[date.day()]} ${date.format("a h:mm")}`;
  }
  return date.format("M월 D일");
};

const NotificationItem = ({ item, onPress, onAccept, onReject, isProcessing }) => (
  <Pressable
    onPress={() => onPress(item)}
    className="flex-row items-start px-5 py-4 border-b border-gray-100"
    style={{ backgroundColor: item.isRead ? "#fff" : "#F5F7FF" }}
  >
    <Image
      source={item.actorProfileImage ? { uri: item.actorProfileImage } : require("@assets/strider-logo.png")}
      style={{ width: 44, height: 44, borderRadius: 22, marginRight: 12, marginTop: 2 }}
    />
    <View className="flex-1">
      <Text className="text-sm font-bold text-black mb-1">{item.title}</Text>
      <Text className="text-sm text-gray-600 leading-5">{item.content}</Text>

      {/* 팔로우 요청: 수락 / 거절 */}
      {item.type === "FOLLOW_REQUEST" && (
        <View className="flex-row mt-2" style={{ gap: 8 }}>
          <Pressable
            disabled={isProcessing}
            onPress={() => onAccept(item)}
            className="px-4 py-1.5 rounded-md active:opacity-80"
            style={{ backgroundColor: "#6178FD" }}
          >
            <Text className="text-xs font-semibold text-white">수락</Text>
          </Pressable>
          <Pressable
            disabled={isProcessing}
            onPress={() => onReject(item)}
            className="px-4 py-1.5 rounded-md border border-gray-300 active:opacity-80"
          >
            <Text className="text-xs font-semibold text-gray-600">거절</Text>
          </Pressable>
        </View>
      )}
    </View>
    <View className="items-end ml-2 min-w-[60px]">
      <Text className="text-xs text-gray-400 mb-2">
        {formatNotificationTime(item.createdAt)}
      </Text>
      {isFeedType(item.type) &&
        (item.thumbnail ? (
          <Image
            source={{ uri: item.thumbnail }}
            style={{ width: 48, height: 48, borderRadius: 6 }}
          />
        ) : (
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 6,
              backgroundColor: "#E5E7EB",
            }}
          />
        ))}
    </View>
  </Pressable>
);

export default function AlarmScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("ALL");
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  const { data: notifications = [], isLoading } = useNotificationsQuery();
  const { mutate: deleteAll, isPending: isDeleting } =
    useDeleteAllNotificationsMutation();
  const { mutate: acceptRequest, isPending: isAccepting } =
    useFollowRequestMutation("accept");
  const { mutate: rejectRequest, isPending: isRejecting } =
    useFollowRequestMutation("reject");
  const { mutate: markAsRead } = useMarkNotificationReadMutation();

  const handleAccept = (item) =>
    acceptRequest({ followerId: item.actorUserId, notificationId: item.id });
  const handleReject = (item) =>
    rejectRequest({ followerId: item.actorUserId, notificationId: item.id });

  const handlePress = (item) => {
    if (!item.isRead) markAsRead(item.id);

    const route = getNotificationRoute(item);
    if (route) router.push(route);
  };

  const filtered =
    activeTab === "ALL"
      ? notifications
      : notifications.filter((n) => matchesTab(n.type, activeTab));

  return (
    <SafeAreaView className="flex-1 bg-white">
      <TopBar
        title="알림"
        rightComponent={
          <View className="flex-row items-center" style={{ gap: 16 }}>
            <Pressable onPress={() => setDeleteModalVisible(true)}>
              <Feather name="trash-2" size={22} color="black" />
            </Pressable>
            <Pressable
              onPress={() =>
                router.push("/(setting)/alarm/notificationSettings")
              }
            >
              <Feather name="settings" size={22} color="black" />
            </Pressable>
          </View>
        }
      />

      {/* 탭 바 */}
      <View className="flex-row border-b border-gray-200">
        {TABS.map((tab) => (
          <Pressable
            key={tab.key}
            className="flex-1 items-center py-3"
            onPress={() => setActiveTab(tab.key)}
          >
            <Text
              className={`text-sm font-semibold ${
                activeTab === tab.key ? "text-black" : "text-gray-400"
              }`}
            >
              {tab.label}
            </Text>
            {activeTab === tab.key && (
              <View
                className="absolute bottom-0 left-0 right-0"
                style={{ height: 2, backgroundColor: "#000" }}
              />
            )}
          </Pressable>
        ))}
      </View>

      {/* 알림 목록 */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#999" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NotificationItem
              item={item}
              onPress={handlePress}
              onAccept={handleAccept}
              onReject={handleReject}
              isProcessing={isAccepting || isRejecting}
            />
          )}
          ListEmptyComponent={
            <View className="items-center py-20">
              <Text className="text-sm text-gray-400">알림이 없습니다.</Text>
            </View>
          }
        />
      )}

      {/* 전체 삭제 확인 모달 */}
      <Modal
        transparent
        visible={deleteModalVisible}
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={{ flex: 1, justifyContent: "flex-end" }}>
          <Pressable
            style={{
              ...StyleSheet.absoluteFillObject,
              backgroundColor: "rgba(0,0,0,0.45)",
            }}
            onPress={() => setDeleteModalVisible(false)}
          />

          <View style={{ paddingHorizontal: 12, paddingBottom: 12 }}>
            {/* 액션 그룹 */}
            <View
              className="bg-white"
              style={{
                borderRadius: 16,
                overflow: "hidden",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.12,
                shadowRadius: 12,
                elevation: 8,
              }}
            >
              <View className="items-center pt-3 pb-1">
                <View
                  style={{
                    width: 36,
                    height: 5,
                    borderRadius: 2.5,
                    backgroundColor: "#E5E7EB",
                  }}
                />
              </View>
              <View className="items-center pb-3 pt-2 px-5">
                <Text className="text-sm text-gray-400">
                  알림 전체를 삭제할까요?
                </Text>
              </View>
              <Pressable
                className="items-center py-4 border-t border-gray-100 active:bg-gray-50"
                disabled={isDeleting}
                onPress={() =>
                  deleteAll(undefined, {
                    onSettled: () => setDeleteModalVisible(false),
                  })
                }
              >
                {isDeleting ? (
                  <ActivityIndicator color="#EF4444" />
                ) : (
                  <Text className="text-base font-semibold text-red-500">
                    전체 삭제
                  </Text>
                )}
              </Pressable>
            </View>

            {/* 닫기 (별도 카드) */}
            <Pressable
              className="bg-white items-center py-4 mt-2 active:bg-gray-50"
              style={{
                borderRadius: 16,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.12,
                shadowRadius: 12,
                elevation: 8,
              }}
              onPress={() => setDeleteModalVisible(false)}
            >
              <Text className="text-base font-semibold text-black">닫기</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
