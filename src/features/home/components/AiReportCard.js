import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import dayjs from "dayjs";
import "dayjs/locale/ko";

dayjs.locale("ko");

export default function AiReportCard({ data, weeklyData, isLoading, isFetching, isError, onRetry, onReset }) {
    const router = useRouter();
    if (isLoading) {
        return (
            <View className="bg-[#E8F5EE] rounded-2xl p-5 mx-4 mb-3">
                <View className="items-center py-4">
                    <ActivityIndicator size="large" color="#2E7D52" />
                    <Text className="text-sm text-[#2E7D52] mt-3">AI가 분석 중이에요...</Text>
                </View>
            </View>
        );
    }

    if (isError || !data) {
        return (
            <View className="bg-[#E8F5EE] rounded-2xl p-5 mx-4 mb-3">
                <View className="flex-row items-center justify-between">
                    <Text className="text-sm text-[#2E7D52]">AI 분석 중 문제가 생겼어요 🤖</Text>
                    {onRetry && (
                        <TouchableOpacity onPress={onRetry}>
                            <Text className="text-xs text-[#2E7D52] font-semibold">다시 시도</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    }

    const dateStr = dayjs().format("M월 D일 · dddd");

    // 지난 주 대비 증감률 계산 (weeklyAvg가 존재하고 lastWeekAvg가 0 이상일 때만)
    let changePercent = null;
    if (weeklyData?.weeklyAvg != null && weeklyData?.lastWeekAvg > 0) {
        changePercent = Math.round(
            ((weeklyData.weeklyAvg - weeklyData.lastWeekAvg) / weeklyData.lastWeekAvg) * 100
        );
    }

    // changePercent 우선, 없으면 trend fallback
    const direction =
        changePercent !== null
            ? changePercent > 0 ? "up" : changePercent < 0 ? "down" : "stable"
            : (data.trend ?? "stable");

    const trendConfig = {
        up:     { icon: "arrow-up",    bg: "#3CD281", sign: "+", label: "상승 중" },
        down:   { icon: "arrow-down",  bg: "#FF716C", sign: "",  label: "하락 중" },
        stable: { icon: "remove",      bg: "#9FA4B0", sign: "",  label: "유지 중" },
    };
    const trend = trendConfig[direction] ?? trendConfig.stable;
    // changePercent 있으면 숫자 배지, 없으면(첫 주 등) trend 텍스트 배지
    const displayLabel =
        changePercent !== null
            ? `${trend.sign}${changePercent}%`
            : trend.label;

    return (
        <View className="bg-[#E8F5EE] rounded-2xl p-5 mx-4 mb-3">
            {/* 헤더 */}
            <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center gap-2">
                    <View className="bg-[#C8E6D4] rounded-full px-2 py-0.5">
                        <Text className="text-xs font-bold text-[#2E7D52]">AI</Text>
                    </View>
                    <Text className="text-xs text-[#4A7D62]">{dateStr}</Text>
                    {isFetching && <ActivityIndicator size="small" color="#2E7D52" />}
                </View>
                <View
                    className="flex-row items-center px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: trend.bg }}
                >
                    <Ionicons name={trend.icon} size={11} color="white" />
                    <Text className="text-xs font-bold text-white ml-0.5">
                        {displayLabel}
                    </Text>
                </View>
            </View>

            {/* 요약 */}
            <Text className="text-sm font-semibold text-[#1E5C3A] leading-5 mb-2">
                {data.summary}
            </Text>

            {/* 동기부여 문구 */}
            <Text className="text-xs text-[#4A7D62] leading-4 mb-4">
                "{data.motivation}"
            </Text>

            <View className="flex-row items-center gap-2">
                {/* 자세히 보기 버튼 */}
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => router.push("/analysis/ai-report")}
                    className="bg-[#2E7D52] rounded-full px-4 py-2 flex-row items-center"
                >
                    <Text className="text-xs font-semibold text-white">자세히 보기</Text>
                    <Ionicons name="arrow-forward" size={12} color="white" style={{ marginLeft: 4 }} />
                </TouchableOpacity>

                {/* 재분석 버튼 */}
                {onReset && !isFetching && (
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={onReset}
                        className="rounded-full px-3 py-2 flex-row items-center"
                        style={{ backgroundColor: "#C8E6D4" }}
                    >
                        <Ionicons name="refresh" size={12} color="#2E7D52" />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}
