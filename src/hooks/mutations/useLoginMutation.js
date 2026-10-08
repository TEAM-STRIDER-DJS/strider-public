import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@src/store/authStore";
import { resetPasswordApi, loginApi, loginWithKakaoApi, loginWithNaverApi, sendCodeApi, signUpStriderApi, logoutApi, withdrawApi } from "@src/api/authApi";
import { connectStomp, disconnectStomp } from "@src/lib/stomp";

export function useLoginMutation() {
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: ({ id, password }) => loginApi({ id, password }),
    onSuccess: (res) => {
      setAuth({
        userId: res.data.userId,
        accessToken: res.data.token,
        refreshToken: res.data.refreshToken,
      });
      connectStomp();
    },
  });
}

export function useSignUpStriderMutation() {
  return useMutation({
    mutationFn: ({ 
      id, 
      password, 
      phoneNumber, 
      marketing, 
      marketing_push, 
      marketing_email, 
      marketing_sms 
    }) => signUpStriderApi({ 
      id, 
      password, 
      phoneNumber, 
      marketing, 
      marketing_push, 
      marketing_email, 
      marketing_sms 
    }),
  });
}

export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: ({ 
      password, 
      phoneNumber
    }) => resetPasswordApi({ 
      password, 
      phoneNumber
    }),
  });
}

export const useSocialLogin = (provider) => {
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: (accessToken) => {
      return provider === "KAKAO"
        ? loginWithKakaoApi(accessToken)
        : loginWithNaverApi(accessToken);
    },

    onSuccess: (res) => {
      const { userId, accessToken, refreshToken, userStatus } = res.data;
      // userId가 없으면 채팅 소켓의 사용자 단위 구독(/sub/user/{userId}/notification, /error)이
      // 걸리지 않아 목록 실시간 갱신과 전송 실패 알림이 모두 죽는다
      if (!userId) {
        console.warn("[소셜 로그인] 응답에 userId가 없습니다. 채팅 사용자 구독이 동작하지 않습니다.");
      }
      setAuth({
        userId,
        accessToken,
        refreshToken,
        userStatus,
      });
      connectStomp();
    },
  });
};

export function useSendPhoneCodeMutation() {
  return useMutation({
    mutationFn: async (phoneNumber) => {
      console.log("[sendCode] request payload:");
      try {
        const res = await sendCodeApi({ phoneNumber });
        console.log("[sendCode] response:");
        return res;
      } catch (err) {
        // log detailed error info
        if (err.response) {
          console.error("[sendCode] error response:");
        } else if (err.request) {
          console.error("[sendCode] no response received, request:");
        } else {
          console.error("[sendCode] request setup error:");
        }
        throw err;
      }
    },
  });
}

export const useLogoutMutation = () => {
  const queryClient = useQueryClient();
  const { userId, refreshToken, clearAuth } = useAuthStore();

  return useMutation({
    mutationFn: () =>
      logoutApi({
        userId,
        refreshToken,
      }),

    onSuccess: () => {
      disconnectStomp();
      clearAuth(); // Zustand 스토어 초기화
      queryClient.clear(); // 캐시 전부 제거
    },
  });
};

export const useWithdrawMutation = () => {
  const queryClient = useQueryClient();
  const { userId, refreshToken, clearAuth } = useAuthStore();

  return useMutation({
    mutationFn: () =>
      withdrawApi({
        userId,
        refreshToken,
      }),

    onSuccess: () => {
      disconnectStomp();
      clearAuth(); // Zustand 스토어 초기화
      queryClient.clear(); // 캐시 전부 제거
    },

    onError: () => {
      Alert.alert("회원 탈퇴 실패", "회원 탈퇴 처리 중 문제가 발생했습니다.");
    },
  });
};
