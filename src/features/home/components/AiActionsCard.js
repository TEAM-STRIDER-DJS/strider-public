import React, { useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView } from "react-native";
import { useCompleteAiAction } from "@src/hooks/queries/useAnalysisQuery";

const ACTION_ICONS = ["🚶", "🪜", "💧", "🏃", "🧘", "🚴", "⚡", "🌿"];
const CARD_HEIGHT = 170;

function durationLabel(min) {
    if (!min || min === 0) return "즉시";
    if (min < 60) return `${min}분`;
    return `${Math.floor(min / 60)}시간`;
}

function ActionCard({ action, index, isDone, onToggle }) {
    const isImmediate = !action.durationMin || action.durationMin === 0;
    const badgeColor = isImmediate ? "#FF9500" : "#3CD281";
    const emoji = ACTION_ICONS[index % ACTION_ICONS.length];

    return (
        <View
            className="bg-white rounded-2xl p-4 mr-2 shadow-sm"
            style={{ width: 148, opacity: isDone ? 0.6 : 1 }}
        >
            {/* 아이콘 + 시간 뱃지 */}
            <View className="flex-row justify-between items-start mb-2">
                <View className="bg-[#F3F4F6] rounded-xl w-10 h-10 items-center justify-center">
                    <Text style={{ fontSize: 20 }}>{emoji}</Text>
                </View>
                <View
                    className="px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${badgeColor}20` }}
                >
                    <Text className="text-xs font-bold" style={{ color: badgeColor }}>
                        {durationLabel(action.durationMin)}
                    </Text>
                </View>
            </View>

            {/* 제목 */}
            <Text
                className="text-sm font-bold mb-0.5"
                numberOfLines={2}
                style={{ color: isDone ? "#9FA4B0" : "#333A44" }}
            >
                {action.title}
            </Text>

            {/* 설명 */}
            <Text className="text-xs text-[#9FA4B0] mb-2" numberOfLines={1}>
                {action.description}
            </Text>

            {/* 완료 버튼 */}
            <TouchableOpacity
                onPress={() => onToggle(action.id)}
                className="rounded-full py-1.5 items-center mt-2"
                style={{ backgroundColor: isDone ? "#3CD281" : "#F3F4F6" }}
            >
                <Text
                    className="text-xs font-semibold"
                    style={{ color: isDone ? "white" : "#666F7C" }}
                >
                    {isDone ? "완료 ✓" : "완료하기"}
                </Text>
            </TouchableOpacity>
        </View>
    );
}

function SectionHeader({ isFetching }) {
    return (
        <View className="flex-row items-center px-4 mb-3">
            <Text className="text-base font-bold text-[#333A44] mr-2">AI 추천 액션</Text>
            <View className="bg-[#EEF0FF] rounded-full px-2 py-0.5">
                <Text className="text-xs font-bold text-[#6178FD]">AI</Text>
            </View>
            {isFetching && (
                <ActivityIndicator size="small" color="#6178FD" style={{ marginLeft: 6 }} />
            )}
        </View>
    );
}

export default function AiActionsCard({ data, userId, isLoading, isFetching, isError, onRetry }) {
    const [completed, setCompleted] = useState({});
    const { mutate: completeAction } = useCompleteAiAction();

    const handleToggle = (actionId) => {
        const wasCompleted = completed[actionId];
        setCompleted((prev) => ({ ...prev, [actionId]: !prev[actionId] }));
        if (!wasCompleted) completeAction({ actionId, userId });
    };

    if (isLoading) {
        return (
            <View className="mb-3">
                <SectionHeader isFetching={false} />
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingLeft: 16, paddingRight: 16 }}
                    scrollEnabled={false}
                >
                    {[1, 2, 3].map((i) => (
                        <View
                            key={i}
                            className="bg-white rounded-2xl mr-3"
                            style={{ width: 152, height: CARD_HEIGHT, opacity: 0.5 }}
                        />
                    ))}
                </ScrollView>
                <View className="items-center mt-3">
                    <ActivityIndicator size="small" color="#6178FD" />
                    <Text className="text-xs text-[#9FA4B0] mt-2">맞춤 액션을 준비 중이에요...</Text>
                </View>
            </View>
        );
    }

    if (isError || !data?.actions?.length) {
        return (
            <View className="mb-3 px-4">
                <SectionHeader isFetching={false} />
                <View className="bg-white rounded-2xl p-5 shadow-sm flex-row items-center justify-between">
                    <Text className="text-sm text-[#9FA4B0]">
                        {isError ? "액션 추천 중 문제가 생겼어요 🤖" : "추천 액션이 없어요."}
                    </Text>
                    {isError && onRetry && (
                        <TouchableOpacity onPress={onRetry}>
                            <Text className="text-xs text-[#6178FD] font-semibold">다시 시도</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    }

    return (
        <View className="mb-3">
            <SectionHeader isFetching={isFetching} />
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingLeft: 16, paddingRight: 16 }}
                snapToInterval={148 + 8}
                decelerationRate="fast"
            >
                {data.actions.map((action, index) => (
                    <ActionCard
                        key={action.id}
                        action={action}
                        index={index}
                        isDone={!!completed[action.id]}
                        onToggle={handleToggle}
                    />
                ))}
            </ScrollView>
        </View>
    );
}
