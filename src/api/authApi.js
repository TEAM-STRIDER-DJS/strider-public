import { api } from "@src/lib/api";

export const refreshAccessToken = async ({ refreshToken }) => {
  const res = await api.post("/api/v1/strider/user-profile/auth/token", {
    refreshToken,
  });
  return res.data;
};

export const loginApi = async ({ id, password }) => {
  const res = await api.post("/api/v1/strider/user-profile/login", {
    id,
    password,
  });
  return res.data;
};

export const loginWithKakaoApi = async ({ accessToken }) => {
  const res = await api.post("/api/v1/strider/user-profile/login/kakao", {
    accessToken,
  });
  return res;
};

export const loginWithNaverApi = async ({ accessToken }) => {
  const res = await api.post("/api/v1/strider/user-profile/login/naver", {
    accessToken,
  });
  return res;
};

export const sendCodeApi = async ({ phoneNumber }) => {
  const res = await api.post("/api/v1/strider/user-profile/phone/send-code", {
    phoneNumber,
  });
  return res;
};

export const verifyPhoneCodeApi = async ({ phoneNumber, inputCode }) => {
  const res = await api.post("/api/v1/strider/user-profile/phone/verify-code", {
    phoneNumber,
    inputCode,
  });
  return res;
};

export const findMyIdQueryApi = async ({ phoneNumber, inputCode }) => {
  const res = await api.post("/api/v1/strider/user-profile/find/id", {
    phoneNumber,
    inputCode,
  });
  return res;
};

export const checkAvailableIdApi = async (id) => {
  const res = await api.get(`/api/v1/strider/user-profile/strider-user/${id}`);
  return res;
};

export const signUpStriderApi = async ({ id, password, phoneNumber, marketing, marketing_push, marketing_email, marketing_sms }) => {
  const res = await api.post("/api/v1/strider/user-profile/signup", {
    id,
    password,
    phoneNumber,
    marketing,
    marketing_push,
    marketing_email,
    marketing_sms
  });
  return res;
};

export const resetPasswordApi = async ({ password, phoneNumber }) => {
  const res = await api.post("/api/v1/strider/user-profile/password/reset", {
    password,
    phoneNumber
  });
  return res;
};

export const logoutApi = async ({ userId, refreshToken }) => {
  return api.post("/api/v1/strider/user-profile/logout", {
    userId,
    refreshToken,
  });
};

export const withdrawApi = ({ userId, refreshToken }) =>
  api.post("/api/v1/strider/user-profile/delete", {
    userId,
    refreshToken,
  });
