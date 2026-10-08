import { useQuery } from "@tanstack/react-query";
import { getSettingsApi } from "@src/api/settingApi";
import { useAuthStore } from "@src/store/authStore";

export const useSettingsQuery = ({ serviceType }) => {
  const { userId } = useAuthStore();

  return useQuery({
    queryKey: ["settings", userId, serviceType],
    queryFn: () => getSettingsApi(),
    enabled: !!userId && !!serviceType,
    staleTime: 1000 * 60 * 5,
  });
};
