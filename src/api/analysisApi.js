import { api } from "@src/lib/api";

// ────────────────────────────────────────────────────────────────────────────
// Health
// ────────────────────────────────────────────────────────────────────────────

/** 오늘 건강 데이터 조회 */
export const getHealthTodayApi = async (userId) => {
    const res = await api.get(`/api/v1/strider/analysis/health/today`, {
        params: { userId },
    });
    return res.data;
};

/** 주간 건강 데이터 조회 */
export const getHealthWeeklyApi = async (userId) => {
    const res = await api.get(`/api/v1/strider/analysis/health/weekly`, {
        params: { userId },
    });
    return res.data;
};

/** 건강 데이터 동기화 */
export const syncHealthApi = async (data) => {
    const res = await api.post(`/api/v1/strider/analysis/health/sync`, data);
    return res.data;
};

// ────────────────────────────────────────────────────────────────────────────
// AI
// ────────────────────────────────────────────────────────────────────────────

/** AI 건강 리포트 조회 */
export const getAiReportApi = async (userId) => {
    const res = await api.get(`/api/v1/strider/analysis/ai/report`, {
        params: { userId },
    });
    return res.data;
};

/** AI 추천 액션 조회 */
export const getAiActionsApi = async (data) => {
    const res = await api.post(`/api/v1/strider/analysis/ai/actions`, data);
    return res.data;
};

/** AI 액션 완료 로그 */
export const completeAiActionApi = async ({ actionId, userId }) => {
    // const res = await api.post(
    //     `/api/v1/strider/analysis/ai/actions/${actionId}/complete`,
    //     null,
    //     { params: { userId } }
    // );
    // return res.data;
    return
};
