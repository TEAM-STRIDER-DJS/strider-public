import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateSettingApi } from "@src/api/settingApi";
import { useAuthStore } from "@src/store/authStore";

/**
 * 설정 업데이트 mutation
 */
export const useUpdateSettingsMutation = ({ serviceType }) => {
  const queryClient = useQueryClient();
  const { userId } = useAuthStore();

  return useMutation({
    mutationFn: ({ settingKey, settingValue }) =>
      updateSettingApi({
        serviceType,
        settingKey,
        settingValue,
      }),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["settings", userId, serviceType],
      });
    },
    onError: (error) => {
      console.error("Failed to update setting:");
    },
  });
};
