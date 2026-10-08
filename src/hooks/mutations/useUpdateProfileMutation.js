import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";
import { useAuthStore } from "@src/store/authStore";
import {
  updateProfileApi,
  updateProfileImageApi,
  updatePasswordApi,
  updateVisibilityApi,
} from "@src/api/profileApi";

/**
 * 닉네임 / 소개 등 일반 프로필 수정
 */
export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.userId);

  return useMutation({
    mutationFn: (payload) =>
      updateProfileApi({
        userId,
        ...payload,
      }),

    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: ["profile", userId] });

      const prevProfile = queryClient.getQueryData(["profile", userId]);

      queryClient.setQueryData(["profile", userId], (old) => ({
        ...old,
        ...newData,
      }));

      return { prevProfile };
    },

    onError: (_error, _newData, context) => {
      if (context?.prevProfile) {
        queryClient.setQueryData(["profile", userId], context.prevProfile);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["profile", userId],
      });
    },
  });
}

/**
 * 프로필 이미지 업로드 / 삭제
 */
export function useUpdateProfileImageMutation() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.userId);

  return useMutation({
    mutationFn: (payload) =>
      updateProfileImageApi({
        userId,
        ...payload,
      }),

    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: ["profile", userId] });

      const prevProfile = queryClient.getQueryData(["profile", userId]);

      queryClient.setQueryData(["profile", userId], (old) => ({
        ...old,
        ...newData,
      }));

      return { prevProfile };
    },

    onError: (_error, _newData, context) => {
      if (context?.prevProfile) {
        queryClient.setQueryData(["profile", userId], context.prevProfile);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["profile", userId],
      });
    },
  });
}

/**
 * 계정 공개 / 비공개 설정
 */
export function useUpdateVisibilityMutation() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.userId);

  return useMutation({
    mutationFn: (isPublic) => updateVisibilityApi({ userId, isPublic }),

    onMutate: async (isPublic) => {
      await queryClient.cancelQueries({ queryKey: ["profile", userId] });

      const prevProfile = queryClient.getQueryData(["profile", userId]);

      queryClient.setQueryData(["profile", userId], (old) => ({
        ...old,
        isPublic,
      }));

      return { prevProfile };
    },

    onError: (_error, _newData, context) => {
      if (context?.prevProfile) {
        queryClient.setQueryData(["profile", userId], context.prevProfile);
      }
      Alert.alert("설정 변경 실패", "잠시 후 다시 시도해 주세요.");
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", userId] });
    },
  });
}

const PASSWORD_ERROR_MESSAGE_MAP = {
  4000: "현재 비밀번호가 올바르지 않습니다.",
  4004: "사용자 정보를 찾을 수 없습니다.",
};

/**
 * 비밀번호 변경
 */
export function useUpdatePasswordMutation() {
  const userId = useAuthStore((state) => state.userId);

  return useMutation({
    mutationFn: ({ currentPassword, newPassword }) =>
      updatePasswordApi({
        userId,
        currentPassword,
        newPassword,
      }),

    onError: (error) => {
      const code = error?.response?.data?.code;

      const message =
        PASSWORD_ERROR_MESSAGE_MAP[code] ??
        "비밀번호 변경 중 문제가 발생했습니다.";

      Alert.alert("비밀번호 변경 실패", message);
    },
  });
}
