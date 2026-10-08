import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    getHealthTodayApi,
    getHealthWeeklyApi,
    getAiReportApi,
    getAiActionsApi,
    completeAiActionApi,
    syncHealthApi,
} from "@src/api/analysisApi";

// ────────────────────────────────────────────────────────────────────────────
// Health
// ────────────────────────────────────────────────────────────────────────────

/** 오늘 건강 데이터 조회 */
export const useHealthToday = (userId) => {
    return useQuery({
        queryKey: ["health", "today", userId],
        queryFn: () => getHealthTodayApi(userId),
        enabled: !!userId,
        staleTime: 1000 * 60 * 5,
    });
};

/** 주간 건강 데이터 조회 */
export const useHealthWeekly = (userId) => {
    return useQuery({
        queryKey: ["health", "weekly", userId],
        queryFn: () => getHealthWeeklyApi(userId),
        enabled: !!userId,
        staleTime: 1000 * 60 * 5,
    });
};

/** 건강 데이터 동기화 */
export const useSyncHealth = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: syncHealthApi,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["health", "today", variables.userId] });
            queryClient.invalidateQueries({ queryKey: ["health", "weekly", variables.userId] });
        },
    });
};

// ────────────────────────────────────────────────────────────────────────────
// AI
// ────────────────────────────────────────────────────────────────────────────

/** AI 건강 리포트 조회 */
export const useAiReport = (userId) => {
    return useQuery({
        queryKey: ["ai", "report", userId],
        queryFn: () => getAiReportApi(userId),
        enabled: !!userId,
        staleTime: 1000 * 60 * 60,
        retry: 1,
    });
};

/** AI 추천 액션 조회 — sync 완료(lastSyncAt 존재) 후에만 요청 */
export const useAiActions = (userId, healthData) => {
    return useQuery({
        queryKey: ["ai", "actions", userId],
        queryFn: () =>
            getAiActionsApi({
                userId,
                stepsToday: healthData?.stepsToday ?? 0,
                activeMinutes: healthData?.activeMinutes ?? 0,
            }),
        enabled: !!userId && !!healthData?.lastSyncAt,
        staleTime: 1000 * 60 * 60 * 6,
        retry: 1,
    });
};

/** AI 액션 완료 — 완료 로그만 서버에 기록, 액션 목록은 재요청하지 않음 (로컬 state로 관리) */
export const useCompleteAiAction = () => {
    return useMutation({
        mutationFn: completeAiActionApi,
    });
};
