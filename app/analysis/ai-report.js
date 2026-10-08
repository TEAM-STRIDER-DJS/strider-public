import React from "react";
import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "@gluestack-ui/themed";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@src/store/authStore";
import { useAiReport, useHealthWeekly } from "@src/hooks/queries/useAnalysisQuery";
import WeeklyHealthCard from "@src/features/home/components/WeeklyHealthCard";
import TopBar from "@src/components/common/TopBar";
import dayjs from "dayjs";
import "dayjs/locale/ko";

dayjs.locale("ko");

const TREND_CONFIG = {
    up:     { icon: "trending-up",   color: "#3CD281", label: "상승 중" },
    down:   { icon: "trending-down", color: "#FF716C", label: "하락 중" },
    stable: { icon: "remove",        color: "#9FA4B0", label: "유지 중" },
};

export default function AiReportDetail() {
    const userId = useAuthStore((s) => s.userId);
    const { data, isLoading, isError } = useAiReport(userId);
    const { data: weeklyData, isLoading: weeklyLoading } = useHealthWeekly(userId);

    const dateStr = dayjs().format("M월 D일 dddd");

    // 지난 주 대비 증감률
    let changePercent = null;
    if (weeklyData?.weeklyAvg != null && weeklyData?.lastWeekAvg > 0) {
        changePercent = Math.round(
            ((weeklyData.weeklyAvg - weeklyData.lastWeekAvg) / weeklyData.lastWeekAvg) * 100
        );
    }

    const trend = TREND_CONFIG[data?.trend] ?? TREND_CONFIG.stable;

    return (
        <SafeAreaView className="flex-1 bg-[#F6F7F9]">
            <TopBar title="AI 리포트" />

            <ScrollView showsVerticalScrollIndicator={false}>
                {isLoading ? (
                    <View className="items-center py-16">
                        <ActivityIndicator size="large" color="#2E7D52" />
                        <Text className="text-sm text-[#9FA4B0] mt-3">AI가 분석 중이에요...</Text>
                    </View>
                ) : isError || !data ? (
                    <View className="items-center py-16 px-8">
                        <Ionicons name="alert-circle-outline" size={48} color="#9FA4B0" />
                        <Text className="text-sm text-[#9FA4B0] mt-3 text-center">
                            AI 분석 데이터를 불러오지 못했어요.{"\n"}잠시 후 다시 시도해주세요.
                        </Text>
                    </View>
                ) : (
                    <>
                        {/* 헤더 카드 */}
                        <View className="bg-[#E8F5EE] mx-4 mt-4 mb-3 rounded-2xl p-5">
                            <View className="flex-row items-center justify-between mb-3">
                                <View className="flex-row items-center gap-2">
                                    <View className="bg-[#C8E6D4] rounded-full px-2 py-0.5">
                                        <Text className="text-xs font-bold text-[#2E7D52]">AI</Text>
                                    </View>
                                    <Text className="text-xs text-[#4A7D62]">{dateStr}</Text>
                                </View>
                                <View
                                    className="flex-row items-center px-2.5 py-1 rounded-full"
                                    style={{ backgroundColor: `${trend.color}25` }}
                                >
                                    <Ionicons name={trend.icon} size={13} color={trend.color} />
                                    <Text className="text-xs font-semibold ml-1" style={{ color: trend.color }}>
                                        {changePercent !== null
                                            ? `${changePercent > 0 ? "+" : ""}${changePercent}%`
                                            : trend.label}
                                    </Text>
                                </View>
                            </View>
                            <Text className="text-sm font-semibold text-[#1E5C3A] leading-5">
                                {data.summary}
                            </Text>
                        </View>

                        {/* 동기부여 */}
                        <View className="bg-white mx-4 mb-3 rounded-2xl p-5">
                            <View className="flex-row items-center gap-2 mb-3">
                                <Ionicons name="heart" size={16} color="#FF716C" />
                                <Text className="text-sm font-bold text-[#333A44]">오늘의 한 마디</Text>
                            </View>
                            <Text className="text-sm text-[#4A7D62] leading-6 italic">
                                "{data.motivation}"
                            </Text>
                        </View>

                        {/* 조언 */}
                        <View className="bg-white mx-4 mb-3 rounded-2xl p-5">
                            <View className="flex-row items-center gap-2 mb-3">
                                <Ionicons name="bulb" size={16} color="#FFBA21" />
                                <Text className="text-sm font-bold text-[#333A44]">AI 조언</Text>
                            </View>
                            <Text className="text-sm text-[#666F7C] leading-6">{data.advice}</Text>
                        </View>

                        {/* 주간 활동 그래프 */}
                        <View className="mx-4 mb-3">
                            <Text className="text-base font-bold text-[#333A44] mb-3">이번 주 활동</Text>
                            <WeeklyHealthCard data={weeklyData} isLoading={weeklyLoading} />
                        </View>

                        <View className="h-8" />
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
