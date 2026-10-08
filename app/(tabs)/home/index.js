import { runtimeConfig } from "@src/config/runtime";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Platform, RefreshControl, ScrollView, View, TouchableOpacity, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@src/store/authStore";
import { useHealthToday, useHealthWeekly, useAiReport, useAiActions, useSyncHealth } from "@src/hooks/queries/useAnalysisQuery";
import { useFollowFeeds } from "@src/hooks/queries/useFeedQuery";
import { useQueryClient } from "@tanstack/react-query";
import { useProfileQuery } from "@src/hooks/queries/useProfileQuery";
import { formatImageUrl } from "@src/utils/image";
import HealthSummaryCard from "@src/features/home/components/HealthSummaryCard";
import WeeklyHealthCard from "@src/features/home/components/WeeklyHealthCard";
import AiReportCard from "@src/features/home/components/AiReportCard";
import AiActionsCard from "@src/features/home/components/AiActionsCard";
import FollowFeedSection from "@src/features/home/components/FollowFeedSection";
import dayjs from "dayjs";
import { useRouter } from "expo-router";

const STEPS_GOAL = 10000;
const USE_DUMMY = runtimeConfig.demoHealthEnabled;
const DUMMY_HEALTH = {
    stepsToday: 7430,
    stepsGoal: STEPS_GOAL,
    activeMinutes: 42,
    calories: 310,
};

// HealthKit은 네이티브 빌드에서만 require (Expo Go 크래시 방지)
let initHealthKit, getTodayHealthData, getWeeklyHealthData;
if (Platform.OS === "ios" && runtimeConfig.healthSyncEnabled && !USE_DUMMY) {
    const hk = require("@src/lib/healthKit");
    initHealthKit = hk.initHealthKit;
    getTodayHealthData = hk.getTodayHealthData;
    getWeeklyHealthData = hk.getWeeklyHealthData;
}

const Home = () => {
    const router = useRouter();
    const userId = useAuthStore((state) => state.userId);
    const syncedToday = useRef(false);
    const syncedWeekly = useRef(false);
    const healthKitReady = useRef(false);

    // 내 프로필 정보 및 이미지 동적 바인딩을 위한 리액트 쿼리 연동
    const { data: profile } = useProfileQuery(userId);
    const profileImageUrl = profile ? formatImageUrl(profile.profileImage || profile.profileThumbImage) : null;

    const { data: healthToday, isLoading: healthLoading, refetch: refetchToday } = useHealthToday(userId);
    const { data: healthWeekly, isLoading: weeklyLoading, refetch: refetchWeekly } = useHealthWeekly(userId);
    const { data: aiReport, isLoading: reportLoading, isFetching: reportFetching, isError: reportError, refetch: refetchReport } = useAiReport(userId);
    const {
        data: aiActions,
        isLoading: actionsLoading,
        isFetching: actionsFetching,
        isError: actionsError,
        refetch: refetchActions,
    } = useAiActions(userId, healthToday);
    const { data: followFeeds, isLoading: feedsLoading, refetch: refetchFeeds } = useFollowFeeds();

    const { mutate: syncHealth } = useSyncHealth();
    const queryClient = useQueryClient();
    const [refreshing, setRefreshing] = useState(false);

    const ensureHealthKitReady = async () => {
        if (Platform.OS !== "ios") throw new Error("iOS only");
        if (!healthKitReady.current) {
            await initHealthKit();
            healthKitReady.current = true;
        }
    };

    // 오늘 데이터 sync
    useEffect(() => {
        if (!runtimeConfig.healthSyncEnabled || !userId || syncedToday.current || Platform.OS !== "ios") return;

        const todayStr = dayjs().format("YYYY-MM-DD");
        if (healthToday?.date === todayStr && healthToday?.lastSyncAt) {
            syncedToday.current = true;
            return;
        }

        const sync = async () => {
            try {
                const data = USE_DUMMY
                    ? DUMMY_HEALTH
                    : await (async () => {
                          await ensureHealthKitReady();
                          return getTodayHealthData();
                      })();
                syncHealth({ userId, date: todayStr, ...data, stepsGoal: STEPS_GOAL });
                syncedToday.current = true;
            } catch (e) {
                console.warn("오늘 health sync 실패:");
            }
        };

        sync();
    }, [userId, healthToday]);

    // 주간 데이터 sync
    useEffect(() => {
        if (!runtimeConfig.healthSyncEnabled || !userId || syncedWeekly.current || weeklyLoading || Platform.OS !== "ios") return;

        const existingDays = healthWeekly?.dailyData?.length ?? 0;
        if (existingDays >= 6) {
            syncedWeekly.current = true;
            return;
        }

        const sync = async () => {
            try {
                if (USE_DUMMY) { syncedWeekly.current = true; return; }
                await ensureHealthKitReady();
                const weeklyData = await getWeeklyHealthData();
                const todayStr = dayjs().format("YYYY-MM-DD");
                for (const day of weeklyData.filter((d) => d.date !== todayStr)) {
                    syncHealth({ userId, date: day.date, ...day, stepsGoal: STEPS_GOAL });
                }
                syncedWeekly.current = true;
            } catch (e) {
                console.warn("주간 health sync 실패:");
            }
        };

        sync();
    }, [userId, healthWeekly, weeklyLoading]);

    const resetAiCache = useCallback(async () => {
        queryClient.removeQueries({ queryKey: ["ai", "report", userId] });
        queryClient.removeQueries({ queryKey: ["ai", "actions", userId] });
        await Promise.all([refetchReport(), refetchActions()]);
    }, [queryClient, userId, refetchReport, refetchActions]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        syncedToday.current = false;
        try {
            await Promise.all([refetchToday(), refetchWeekly(), refetchReport(), refetchActions(), refetchFeeds()]);
        } finally {
            setRefreshing(false);
        }
    }, [refetchToday, refetchWeekly, refetchReport, refetchActions, refetchFeeds]);

    return (
        <SafeAreaView className="flex-1 bg-[#F6F7F9]" edges={['top']}>
            {/* 상단 헤더 */}
            <View className="h-14 flex-row items-center justify-between px-4 border-b border-transparent">
                {/* 가운데 로고 */}
                <View
                    pointerEvents="none"
                    className="absolute left-0 right-0 top-0 bottom-0 items-center justify-center"
                >
                    <Image
                        source={require('@assets/strider-logo-header.png')}
                        style={{ width: 104, height: 30 }}
                        resizeMode="contain"
                    />
                </View>
                <TouchableOpacity onPress={() => router.push('/profile')}>
                    {profileImageUrl ? (
                        <Image
                            source={{ uri: profileImageUrl }}
                            style={{ width: 36, height: 36, borderRadius: 18 }}
                        />
                    ) : (
                        <Image
                            source={require('@assets/strider-logo.png')}
                            style={{ width: 36, height: 36, borderRadius: 18 }}
                        />
                    )}
                </TouchableOpacity>
                <View className="flex-row items-center gap-4">
                    <TouchableOpacity onPress={() => router.push("/feed/register-feed")}>
                        <Ionicons name="add-circle-outline" size={26} color="#333A44" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => router.push("/(setting)/alarm/alarm")}>
                        <Ionicons name="notifications-outline" size={24} color="#333A44" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => router.push('/chat')}>
                        <Ionicons name="chatbubble-outline" size={22} color="#333A44" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                <AiReportCard
                    data={aiReport}
                    weeklyData={healthWeekly}
                    isLoading={reportLoading}
                    isFetching={reportFetching && !reportLoading}
                    isError={reportError}
                    onRetry={refetchReport}
                    onReset={resetAiCache}
                />

                <HealthSummaryCard
                    data={healthToday}
                    weeklyData={healthWeekly}
                    isLoading={healthLoading}
                />

                <WeeklyHealthCard data={healthWeekly} isLoading={weeklyLoading} />

                <AiActionsCard
                    data={aiActions}
                    userId={userId}
                    isLoading={actionsLoading}
                    isFetching={actionsFetching && !actionsLoading}
                    isError={actionsError}
                    onRetry={refetchActions}
                />

                <FollowFeedSection data={followFeeds} isLoading={feedsLoading} />

                <View className="h-6" />
            </ScrollView>
        </SafeAreaView>
    );
};

export default Home;
