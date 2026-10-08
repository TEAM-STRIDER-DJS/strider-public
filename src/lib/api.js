import { runtimeConfig, requireRuntimeUrl } from "@src/config/runtime";
// src/lib/api.js
import axios from "axios";
import { useAuthStore } from "@src/store/authStore";
import { refreshAccessToken } from "@src/api/authApi";
import { queryClient } from "./queryClient";

export const api = axios.create({
  baseURL: runtimeConfig.apiBaseUrl,
  timeout: 35000,
  headers: {
    "Content-Type": "application/json",
  },
});

// --- request: access token 붙이기
api.interceptors.request.use(
  (config) => {
    config.baseURL = requireRuntimeUrl("apiBaseUrl");
    const accessToken = useAuthStore.getState().accessToken;
    console.log("accessToken");
    if (accessToken)
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${accessToken}`,
      };
    return config;
  },
  (error) => Promise.reject(error),
);

// --- response: 401 처리 (동시성 고려)
let isRefreshing = false;
let failedQueue = []; // { resolve, reject, config }

const processQueue = (error, token = null) => {
  failedQueue.forEach((p) => {
    if (error) p.reject(error);
    else {
      if (token) p.config.headers.Authorization = `Bearer ${token}`;
      p.resolve(api(p.config));
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (res) => {
    try {
      console.log("[API Response]");
    } catch (e) {
      console.warn("[API Response] logging failed");
    }
    return res;
  },
  async (error) => {
    const originalRequest = error.config;

    // log error response/request info
    try {
      if (error.response) {
        console.error("[API Response Error]");
      } else if (error.request) {
        console.error("[API No Response]");
      } else {
        console.error("[API Error]");
      }
    } catch (e) {
      console.warn("[API Error] logging failed");
    }

    // 인증 관련 401이고, retry 시도 안한 요청(무한루프 방지)
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      const { refreshToken } = useAuthStore.getState();

      // refreshToken 없으면 바로 로그아웃 처리
      if (!refreshToken) {
        handleLogout();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // 이미 refresh 중이면 큐에 넣고 기다림
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject, config: originalRequest });
        });
      }

      isRefreshing = true;

      try {
        const data = await refreshAccessToken({ refreshToken });
        const newAccessToken = data.accessToken;

        // Zustand에 새로운 토큰 저장
        useAuthStore.getState().setAccessToken(newAccessToken);

        // 재시도: 큐의 요청들에 새 토큰 붙여서 실행
        processQueue(null, newAccessToken);

        // 원래 요청도 재시도
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        handleLogout(); // refresh 실패 시 강제 로그아웃
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

// 로그아웃 핸들러: token clear, react-query 초기화 등
function handleLogout() {
  try {
    // React Query 캐시 비우기 (로그아웃 시 서버 상태 모두 초기화 권장)
    queryClient.clear(); // 또는 invalidateQueries etc.

    // 상태 초기화
    useAuthStore.getState().clearAuth();

    // TODO : 네비게이션을 로그인 화면으로 이동시키는 로직 추가 가능
  } catch (e) {
    console.warn("handleLogout error");
  }
}
