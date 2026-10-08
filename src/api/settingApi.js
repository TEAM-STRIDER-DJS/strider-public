import { api } from "@src/lib/api";

/**
 * 설정 조회
 */
export async function getSettingsApi() {
  const res = await api.get("/api/v1/strider/user-profile/settings");
  console.log("getSettingsApi res.data.data:");

  return res.data.data;
}

/**
 * 설정 업데이트
 */
export async function updateSettingApi({
  serviceType,
  settingKey,
  settingValue,
}) {
  const res = await api.post("/api/v1/strider/user-profile/update/settings", {
    settings: {
      [serviceType]: {
        [settingKey]: settingValue,
      },
    },
  });

  return res.data.data;
}
