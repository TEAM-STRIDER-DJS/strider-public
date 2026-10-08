import { useQuery } from "@tanstack/react-query";
import { getExercisesApi } from "@src/api/profileApi";

/**
 * 운동 종류 목록 조회
 * 반환: [{ id, nameKo, nameEn, kind }]
 */
export const useExercisesQuery = () => {
  return useQuery({
    queryKey: ["exercises"],
    queryFn: getExercisesApi,
    staleTime: 1000 * 60 * 60, // 1시간 (자주 안 바뀜)
  });
};
