import { api } from "@src/lib/api";

export const getProfileInfo = async ({ userId }) => {
  const res = await api.post("/api/v1/strider/user-profile/find", {
    userId,
  });
  console.log("getProfileInfo res.data.data:");
  return res.data.data;
};

/**
 * 프로필 이미지 업데이트 (업로드 / 삭제 공용)
 */
export const updateProfileImageApi = ({
  userId,
  profileImage,
  profileThumbImage,
  profileImageS3Key,
  profileThumbS3Key,
}) => {
  return api.post("/api/v1/strider/user-profile/image", {
    userId,
    profileImage,
    profileThumbImage,
    profileImageS3Key,
    profileThumbS3Key,
  });
};

/**
 * 프로필 기본 정보 업데이트 (닉네임, 소개)
 */
export async function updateProfileApi({ userId, nickname, profileDesc }) {
  const res = await api.post("/api/v1/strider/user-profile/update", {
    userId,
    nickname,
    profileDesc,
  });

  return res.data;
}

/**
 * 비밀번호 변경
 */
export async function updatePasswordApi({
  userId,
  currentPassword,
  newPassword,
}) {
  const res = await api.post("/api/v1/strider/user-profile/update/password", {
    userId,
    currentPassword,
    newPassword,
  });

  return res.data.data;
}

/**
 * 계정 공개 / 비공개 설정
 */
export const updateVisibilityApi = ({ userId, isPublic }) =>
  api.patch(`/api/v1/strider/user-profile/${userId}/visibility`, {
    isPublic,
  });

/**
 * 사용자 차단 / 차단 해제
 */
export const blockUserApi = (targetUserId) =>
  api.post(`/api/v1/strider/user-profile/block/${targetUserId}`);

export const releaseUserBlockApi = (targetUserId) =>
  api.post(`/api/v1/strider/user-profile/release/${targetUserId}`);

/**
 * 사용자 신고
 */
export const reportUserApi = ({ targetId, reasonCode, reasonText }) =>
  api.post("/api/v1/strider/user-profile/report", {
    targetId,
    reasonCode,
    reasonText,
  });

/**
 * 운동 종류 전체 조회
 * 응답: { exercises: [{ id, nameKo, nameEn, kind }] }
 */
export const getExercisesApi = async () => {
  const res = await api.get("/api/v1/strider/user-profile/exercises");
  const data = res.data?.data ?? res.data;
  return data?.exercises ?? [];
};
