import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";

const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];

export default function WeeklyHealthCard({ data, isLoading }) {
    if (isLoading) {
        return (
            <View className="bg-white rounded-2xl p-5 mx-4 mb-3 shadow-sm">
                <View className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
                <View className="flex-row justify-between">
                    {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                        <View key={i} className="items-center flex-1">
                            <View className="h-16 w-6 bg-gray-100 rounded-full mb-1" />
                            <View className="h-3 w-4 bg-gray-200 rounded" />
                        </View>
                    ))}
                </View>
            </View>
        );
    }

    if (!data) return null;

    const { weeklyAvg, lastWeekAvg, daily = [] } = data;
    const maxSteps = Math.max(...daily.map((d) => d.stepsToday), 1);
    const hasLastWeek = lastWeekAvg > 0;
    const avgDiff = weeklyAvg - lastWeekAvg;
    const isUp = avgDiff >= 0;

    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = dayjs().subtract(6 - i, "day").format("YYYY-MM-DD");
        const found = daily.find((d) => d.date === date);
        return { date, stepsToday: found?.stepsToday ?? 0, stepsGoal: found?.stepsGoal ?? 10000 };
    });

    return (
        <View className="bg-white rounded-2xl p-5 mx-4 mb-3 shadow-sm">
            {/* 헤더 */}
            <View className="flex-row items-center justify-between mb-4">
                <Text className="text-base font-bold text-[#333A44]">주간 활동</Text>
                {hasLastWeek ? (
                    <View className="flex-row items-center">
                        <Ionicons
                            name={isUp ? "trending-up" : "trending-down"}
                            size={14}
                            color={isUp ? "#3CD281" : "#FF716C"}
                        />
                        <Text
                            className="text-xs font-semibold ml-1"
                            style={{ color: isUp ? "#3CD281" : "#FF716C" }}
                        >
                            지난 주 대비 {Math.abs(avgDiff).toLocaleString()} 걸음
                        </Text>
                    </View>
                ) : (
                    <Text className="text-xs text-[#9FA4B0]">첫 번째 주예요 🎉</Text>
                )}
            </View>

            {/* 막대 그래프 */}
            <View className="flex-row items-end justify-between mb-1" style={{ height: 80 }}>
                {last7Days.map((day) => {
                    const isToday = day.date === dayjs().format("YYYY-MM-DD");
                    const isGoalMet = day.stepsToday >= day.stepsGoal;
                    const hasSteps = day.stepsToday > 0;
                    const barHeight = hasSteps ? Math.max((day.stepsToday / maxSteps) * 70, 8) : 0;
                    const dayLabel = DAY_LABELS[dayjs(day.date).day() === 0 ? 6 : dayjs(day.date).day() - 1];

                    return (
                        <View key={day.date} className="items-center flex-1">
                            {/* 빈 공간 확보 (막대 없는 날도 정렬) */}
                            <View style={{ height: 70, justifyContent: "flex-end" }}>
                                {hasSteps && (
                                    <View
                                        className="w-6 rounded-full"
                                        style={{
                                            height: barHeight,
                                            backgroundColor: isGoalMet ? "#3CD281" : "#D1D5DB",
                                        }}
                                    />
                                )}
                            </View>
                            <Text
                                className={`text-xs mt-1 ${
                                    isToday ? "font-bold text-[#333A44]" : "text-[#9FA4B0]"
                                }`}
                            >
                                {dayLabel}
                            </Text>
                            {/* 오늘 표시 점 */}
                            {isToday && (
                                <View className="w-1 h-1 rounded-full bg-[#3CD281] mt-0.5" />
                            )}
                        </View>
                    );
                })}
            </View>

            {/* 평균 */}
            <View className="flex-row justify-between border-t border-[#F3F4F6] pt-3 mt-2">
                <View className="items-center flex-1">
                    <Text className="text-xs text-[#9FA4B0] mb-0.5">이번 주 평균</Text>
                    <Text className="text-sm font-bold text-[#333A44]">
                        {weeklyAvg.toLocaleString()}
                    </Text>
                </View>
                <View className="w-px bg-[#F3F4F6]" />
                <View className="items-center flex-1">
                    <Text className="text-xs text-[#9FA4B0] mb-0.5">지난 주 평균</Text>
                    <Text
                        className="text-sm font-bold"
                        style={{ color: hasLastWeek ? "#9FA4B0" : "#D1D5DB" }}
                    >
                        {hasLastWeek ? lastWeekAvg.toLocaleString() : "-"}
                    </Text>
                </View>
            </View>
        </View>
    );
}
