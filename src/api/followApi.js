import { api } from "@src/lib/api";

// 리스트
export const getFollowersApi = (userId) =>
  api.get(`/api/v1/strider/user-profile/${userId}/followers`).then((res) => {
    console.log("[getFollowersApi] response:");
    return res.data.data;
  });

export const getFollowingsApi = (userId) =>
  api.get(`/api/v1/strider/user-profile/${userId}/following`).then((res) => {
    console.log("[getFollowingsApi] response:");
    return res.data.data;
  });


// toggle용 래퍼
export const toggleFollowApi = (isFollowed, userId, targetUserId) => {
  console.log("[toggleFollowApi] called:");
  return isFollowed
    ? api.delete(
        `/api/v1/strider/user-profile/${userId}/unfollow/${targetUserId}`,
      )
    : api.post(`/api/v1/strider/user-profile/${userId}/follow/${targetUserId}`);
};

// 팔로우/팔로잉 합집합 리스트 조회
export const getFollowRelationsApi = (userId) =>
  api.get(`/api/v1/strider/user-profile/${userId}/follow-relations`).then((res) => {
    console.log("[getFollowRelationsApi] response:");
    return res.data.data || [];
  });

