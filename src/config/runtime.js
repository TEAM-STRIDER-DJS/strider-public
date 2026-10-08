import Constants from "expo-constants";

const extra = Constants.expoConfig?.extra ?? {};
const trimUrl = (value) => typeof value === "string" ? value.trim().replace(/\/+$/, "") : "";

export const runtimeConfig = {
  apiBaseUrl: trimUrl(extra.apiBaseUrl),
  chatWebSocketUrl: trimUrl(extra.chatWebSocketUrl),
  mediaBaseUrl: trimUrl(extra.mediaBaseUrl),
  shareBaseUrl: trimUrl(extra.shareBaseUrl),
  healthSyncEnabled: extra.healthSyncEnabled === true,
  demoHealthEnabled: extra.demoHealthEnabled === true,
};

export const requireRuntimeUrl = (name) => {
  const url = runtimeConfig[name];
  if (!url) throw new Error(`Missing runtime configuration: ${name}. Set it in .env and restart the development build.`);
  return url;
};

export const getShareUrl = (postId) =>
  `${requireRuntimeUrl("shareBaseUrl")}/share/${encodeURIComponent(String(postId))}`;
