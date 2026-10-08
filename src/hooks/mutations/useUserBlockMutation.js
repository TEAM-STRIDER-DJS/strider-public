import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert, Platform, ToastAndroid } from "react-native";
import { blockUserApi, releaseUserBlockApi } from "@src/api/profileApi";

const showToast = (message) => {
  if (!message) return;
  if (Platform.OS === "android") {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert("알림", message);
  }
};

export function useUserBlockMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ targetUserId, isBlocked }) =>
      isBlocked ? releaseUserBlockApi(targetUserId) : blockUserApi(targetUserId),

    onMutate: async ({ targetUserId, isBlocked }) => {
      await queryClient.cancelQueries({ queryKey: ["profile", targetUserId] });

      const prevProfile = queryClient.getQueryData(["profile", targetUserId]);

      queryClient.setQueryData(["profile", targetUserId], (old) =>
        old ? { ...old, isBlock: !isBlocked } : old,
      );

      return { prevProfile, targetUserId };
    },

    onSuccess: (_data, vars) => {
      const message = vars?.isBlocked ? "차단 해제 완료" : "차단 완료";
      showToast(message);
    },

    onError: (error, _vars, context) => {
      if (context?.prevProfile && context?.targetUserId) {
        queryClient.setQueryData(
          ["profile", context.targetUserId],
          context.prevProfile,
        );
      }

      const serverMessage =
        typeof error?.response?.data === "string"
          ? error.response.data
          : error?.response?.data?.message ??
            error?.response?.data?.meta?.message ??
            error?.response?.data?.error?.message;

      Alert.alert(
        "차단 처리 실패",
        serverMessage ?? "차단/차단 해제에 실패했습니다.",
      );
    },

    onSettled: (_data, _error, vars) => {
      if (!vars?.targetUserId) return;

      queryClient.invalidateQueries({
        queryKey: ["profile", vars.targetUserId],
      });
    },
  });
}
