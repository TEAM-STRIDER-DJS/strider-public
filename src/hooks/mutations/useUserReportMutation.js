import { useMutation } from "@tanstack/react-query";
import { Alert, Platform, ToastAndroid } from "react-native";
import { reportUserApi } from "@src/api/profileApi";

const showToast = (message) => {
  if (!message) return;
  if (Platform.OS === "android") {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert("알림", message);
  }
};

export function useUserReportMutation() {
  return useMutation({
    mutationFn: ({ targetId, reasonCode, reasonText }) =>
      reportUserApi({
        targetId,
        reasonCode,
        reasonText,
      }),

    onSuccess: () => {
      showToast("신고가 접수되었습니다.");
    },

    onError: (error) => {
      const serverMessage =
        typeof error?.response?.data === "string"
          ? error.response.data
          : error?.response?.data?.message ??
            error?.response?.data?.meta?.message ??
            error?.response?.data?.error?.message;

      Alert.alert("신고 실패", serverMessage ?? "신고 처리에 실패했습니다.");
    },
  });
}
