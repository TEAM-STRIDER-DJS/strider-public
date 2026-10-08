import { useQuery } from "@tanstack/react-query";
import { getProfileInfo } from "@src/api/profileApi";

export const useProfileQuery = ( userId ) => {
  return useQuery({
    queryKey: ["profile", userId],
    queryFn: () => getProfileInfo({ userId }),
    enabled: !!userId, // userId가 있을 때만 실행
    staleTime: 1000 * 60 * 5, // 5분 동안 fresh
  });
};