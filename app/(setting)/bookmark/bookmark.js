import React, { useState } from "react";
import { View, Text, ActivityIndicator, Alert, Platform, ToastAndroid } from "react-native";
import { useRouter } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Button from "@src/components/common/Button";
import TopBar from "@src/components/common/TopBar";
import GridFeedTile from "@src/components/ui/GridFeedTile";
import { useSavedFeeds } from "@src/hooks/queries/useFeedQuery";
import { useToggleFeedSave } from "@src/hooks/mutations/useFeedMutation";
import {
  Pressable,
  VStack,
  SafeAreaView,
  ScrollView,
} from "@gluestack-ui/themed";

const showToast = (message) => {
  if (!message) return;
  if (Platform.OS === "android") {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert("알림", message);
  }
};

/* 메인 Content — 저장한 피드 3열 그리드 */
const MainContent = ({ selectMode, selectedIds, onToggleSelect, onPressPost }) => {
  const { data: feeds, isLoading, error } = useSavedFeeds();

  if (isLoading) {
    return (
      <View className="py-10 items-center justify-center">
        <ActivityIndicator size="large" color="#6178FD" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="py-10 items-center justify-center">
        <Text className="text-gray-400 text-sm">
          저장한 게시물을 불러오지 못했어요.
        </Text>
      </View>
    );
  }

  if (!feeds || feeds.length === 0) {
    return (
      <View className="py-16 items-center justify-center px-8">
        <MaterialIcons name="bookmark-border" size={40} color="#D1D5DB" />
        <Text className="text-gray-400 text-sm mt-3">
          아직 저장한 게시물이 없어요.
        </Text>
        <Text className="text-gray-300 text-xs mt-1 text-center">
          피드에서 북마크를 누르면 여기에 모여요.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="flex-row flex-wrap">
        {feeds.map((item) => (
          <GridFeedTile
            key={String(item.feedPostId)}
            item={item}
            onPressPost={onPressPost}
            selectable={selectMode}
            selected={selectedIds.includes(item.feedPostId)}
            onToggleSelect={onToggleSelect}
          />
        ))}
      </View>
      {/* 선택 모드 하단 삭제 바에 콘텐츠가 가리지 않도록 여백 확보 */}
      {selectMode && <View style={{ height: 72 }} />}
    </ScrollView>
  );
};

export default function BookmarkScreen() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const { mutateAsync: toggleSave } = useToggleFeedSave();

  const handlePressPost = (feedPostId) => {
    router.push({
      pathname: `/feed/${feedPostId}`,
      params: { source: "bookmark" },
    });
  };

  const handleToggleSelect = (feedPostId) => {
    setSelectedIds((prev) =>
      prev.includes(feedPostId)
        ? prev.filter((id) => id !== feedPostId)
        : [...prev, feedPostId]
    );
  };

  const handleEnterSelectMode = () => {
    setShowModal(false);
    setSelectMode(true);
    setSelectedIds([]);
  };

  const handleCancelSelect = () => {
    setSelectMode(false);
    setSelectedIds([]);
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;

    Alert.alert(
      "선택한 게시물 삭제",
      `${selectedIds.length}개의 게시물을 저장 목록에서 삭제할까요?`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            const results = await Promise.allSettled(
              selectedIds.map((postId) => toggleSave({ postId, isSaved: true }))
            );
            const failedCount = results.filter((r) => r.status === "rejected").length;

            setSelectMode(false);
            setSelectedIds([]);

            if (failedCount > 0) {
              showToast(`${failedCount}개 항목은 삭제하지 못했어요.`);
            }
          },
        },
      ]
    );
  };

  return (
    <>
      {/* 어두운 배경 */}
      {showModal && (
        <Pressable
          className="absolute inset-0 z-10 bg-black/60"
          onPress={() => setShowModal(false)}
        />
      )}

      {/* 모달 */}
      {showModal && (
        <View className="absolute bottom-0 left-0 right-0 px-4 pb-6 z-20">
          <View className="bg-white rounded-xl overflow-hidden mb-2">
            <Button
              text="선택..."
              variant="primary"
              size="large"
              onPress={handleEnterSelectMode}
            />
          </View>
          <View className="bg-white rounded-xl overflow-hidden">
            <Button
              text="취소"
              variant="secondary"
              size="large"
              onPress={() => setShowModal(false)}
            />
          </View>
        </View>
      )}

      {/* 일반 콘텐츠 */}
      <SafeAreaView className="flex-1 bg-white">
        <VStack className="h-full w-full bg-white">
          <TopBar
            title={selectMode ? (selectedIds.length > 0 ? `${selectedIds.length}개 선택됨` : "항목 선택") : "저장됨"}
            showBack={!selectMode}
            rightComponent={
              selectMode ? (
                <Pressable onPress={handleCancelSelect} className="flex-1 items-end">
                  <Text className="text-main-blue-1 text-base font-medium">취소</Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={() => setShowModal(true)}
                  className="flex-1 items-end"
                >
                  <Feather name="more-horizontal" size={24} color="black" />
                </Pressable>
              )
            }
          />
          <View className="flex-1">
            <MainContent
              selectMode={selectMode}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onPressPost={handlePressPost}
            />
            {selectMode && (
              <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 pt-2 pb-6">
                <Button
                  text={selectedIds.length > 0 ? `삭제 (${selectedIds.length})` : "삭제"}
                  variant="primary"
                  size="large"
                  disabled={selectedIds.length === 0}
                  className={selectedIds.length > 0 ? "bg-point4-red" : ""}
                  onPress={handleDeleteSelected}
                />
              </View>
            )}
          </View>
        </VStack>
      </SafeAreaView>
    </>
  );
}
