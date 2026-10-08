import React, { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Animated } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import dayjs from "dayjs";

const RADIUS = 42;
const STROKE_WIDTH = 9;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const SIZE = (RADIUS + STROKE_WIDTH) * 2;

// 스켈레톤 shimmer
function Shimmer({ className, style }) {
    const anim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: true }),
                Animated.timing(anim, { toValue: 0, duration: 900, useNativeDriver: true }),
            ])
        ).start();
    }, []);
    const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });
    return <Animated.View className={className} style={[style, { opacity }]} />;
}

function CircularRing({ progress }) {
    const clamped = Math.min(Math.max(progress, 0), 100);
    const offset = CIRCUMFERENCE * (1 - clamped / 100);
    const isGoalMet = clamped >= 100;
    const ringColor = isGoalMet ? "#3CD281" : "#3CD281";

    return (
        <Svg width={SIZE} height={SIZE}>
            <Circle
                cx={SIZE / 2} cy={SIZE / 2} r={RADIUS}
                stroke="#E5E7EB" strokeWidth={STROKE_WIDTH} fill="none"
            />
            {clamped > 0 && (
                <Circle
                    cx={SIZE / 2} cy={SIZE / 2} r={RADIUS}
                    stroke={ringColor} strokeWidth={STROKE_WIDTH} fill="none"
                    strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    rotation="-90"
                    origin={`${SIZE / 2}, ${SIZE / 2}`}
                />
            )}
        </Svg>
    );
}

function computeStreak(weeklyData, todaySteps) {
    if (!weeklyData?.daily) return todaySteps > 0 ? 1 : 0;
    const todayStr = dayjs().format("YYYY-MM-DD");
    const stepMap = {};
    for (const day of weeklyData.daily) stepMap[day.date] = day.stepsToday;
    if (todaySteps > 0) stepMap[todayStr] = todaySteps;

    let streak = 0;
    let cursor = dayjs();
    while (true) {
        const key = cursor.format("YYYY-MM-DD");
        if ((stepMap[key] ?? 0) > 0) { streak++; cursor = cursor.subtract(1, "day"); }
        else break;
    }
    return streak;
}

export default function HealthSummaryCard({ data, weeklyData, isLoading }) {
    const router = useRouter();
    const stepsToday = data?.stepsToday ?? 0;
    const stepsGoal = data?.stepsGoal ?? 10000;
    const calories = data?.calories ?? 0;
    const progress = Math.min((stepsToday / stepsGoal) * 100, 100);
    const remaining = Math.max(stepsGoal - stepsToday, 0);
    const streak = computeStreak(weeklyData, stepsToday);
    const isGoalMet = progress >= 100;

    if (isLoading) {
        return (
            <View className="bg-white rounded-2xl p-5 mx-4 mb-3 shadow-sm">
                <View className="flex-row items-center justify-between mb-4">
                    <Shimmer className="h-4 rounded" style={{ width: 70, backgroundColor: "#E5E7EB" }} />
                    <Shimmer className="h-6 rounded-full" style={{ width: 80, backgroundColor: "#E5E7EB" }} />
                </View>
                <View className="flex-row items-center gap-4">
                    <Shimmer style={{ width: SIZE, height: SIZE, borderRadius: SIZE / 2, backgroundColor: "#E5E7EB" }} />
                    <View className="flex-1 gap-2">
                        <Shimmer className="h-3 rounded" style={{ width: "50%", backgroundColor: "#E5E7EB" }} />
                        <Shimmer className="h-4 rounded" style={{ width: "80%", backgroundColor: "#E5E7EB" }} />
                        <Shimmer className="h-2 rounded-full" style={{ backgroundColor: "#E5E7EB" }} />
                        <Shimmer className="h-3 rounded" style={{ width: "40%", backgroundColor: "#E5E7EB" }} />
                    </View>
                </View>
            </View>
        );
    }

    return (
        <View
            className="rounded-2xl p-5 mx-4 mb-3 shadow-sm"
            style={{ backgroundColor: isGoalMet ? "#F0FDF6" : "white" }}
        >
            {/* 헤더 */}
            <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center gap-2">
                    <Text className="text-base font-bold text-[#333A44]">오늘 현황</Text>
                    {isGoalMet && (
                        <Text className="text-sm">🎉</Text>
                    )}
                </View>
                {streak > 0 && (
                    <View className="flex-row items-center bg-[#FFF3E0] rounded-full px-3 py-1">
                        <Text className="text-xs font-semibold text-[#FF8C00]">
                            🔥 {streak}일 연속
                        </Text>
                    </View>
                )}
            </View>

            {/* 메인: 원형 링 + 챌린지 정보 */}
            <View className="flex-row items-center gap-4 mb-4">
                {/* 원형 링 */}
                <View style={{ position: "relative", width: SIZE, height: SIZE }}>
                    <CircularRing progress={progress} />
                    <View style={{
                        position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                        alignItems: "center", justifyContent: "center",
                    }}>
                        <Text className="text-base font-bold" style={{ color: "#3CD281" }}>
                            {stepsToday.toLocaleString()}
                        </Text>
                        <Text className="text-[10px] text-[#9FA4B0]">걸음</Text>
                    </View>
                </View>

                {/* 챌린지 정보 */}
                <View className="flex-1">
                    <Text className="text-xs text-[#9FA4B0] mb-0.5">오늘 챌린지</Text>
                    <Text className="text-sm font-semibold text-[#333A44] mb-2">
                        {stepsGoal.toLocaleString()}걸음 달성하기
                    </Text>
                    <View className="h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden mb-1">
                        <View
                            className="h-full rounded-full"
                            style={{
                                width: `${Math.min(progress, 100)}%`,
                                backgroundColor: isGoalMet ? "#3CD281" : "#3CD281",
                            }}
                        />
                    </View>
                    {isGoalMet ? (
                        <Text className="text-xs font-semibold text-[#3CD281]">목표 달성! 🎊</Text>
                    ) : (
                        <Text className="text-xs text-[#9FA4B0]">
                            {remaining.toLocaleString()}걸음 남음
                        </Text>
                    )}
                </View>
            </View>

            {/* 하단: 칼로리 + 기록 */}
            <View className="border-t border-[#F3F4F6] pt-3 flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                    <Text className="text-xs font-semibold text-[#FF716C]">
                        {calories.toLocaleString()} kcal
                    </Text>
                    <View className="w-16 h-1 bg-[#F3F4F6] rounded-full overflow-hidden">
                        <View
                            className="h-full bg-[#FF716C] rounded-full"
                            style={{ width: `${Math.min((calories / 500) * 100, 100)}%` }}
                        />
                    </View>
                </View>
                <TouchableOpacity
                    onPress={() => router.push("/feed/register-feed")}
                    className="flex-row items-center gap-1"
                >
                    <Ionicons name="add-circle-outline" size={13} color="#6178FD" />
                    <Text className="text-xs text-[#6178FD]">오늘 기록 남기기</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
