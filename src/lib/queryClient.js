import { QueryClient } from "@tanstack/react-query";

/**
 * 앱 전체가 공유하는 단일 QueryClient.
 *
 * Provider 주입(app/_layout.js)과 로그아웃 시 캐시 초기화(src/lib/api.js)가
 * 반드시 같은 인스턴스를 바라봐야 하므로 여기서 한 번만 생성한다.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,          // 30초
      retry: 1,
      refetchOnWindowFocus: false,   // 앱 포커스 복귀 시 자동 refetch 방지
      refetchOnReconnect: false,     // 네트워크 재연결 시 자동 refetch 방지
    },
  },
});
