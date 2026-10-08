// 알림음 설정 관련 상수
// 백엔드(user-profile settings)와 맞춰야 하는 serviceType / settingKey 값 정의

export const SOUND_SERVICE_TYPE = "SOUND";

// 백엔드 user-profile 설정에 SOUND serviceType 이 구현되면 true 로 변경하세요.
// false 동안에는 서버 호출 없이 로컬(MMKV)에만 저장됩니다.
// ⚠️ user-profile 서비스 재배포 후에 동작합니다(라이브 서버 반영 필요).
export const SOUND_BACKEND_ENABLED = true;

export const SOUND_KEYS = {
  ENABLED: "SOUND_ENABLED", // "ON" | "OFF"
  VIBRATION: "SOUND_VIBRATION", // "ON" | "OFF"
  TONE: "SOUND_TONE", // SOUND_OPTIONS[].key
};

// 알림음 종류 + 미리듣기용 에셋
// asset 이 null 이면 미리듣기 재생을 하지 않음(무음)
export const SOUND_OPTIONS = [
  {
    key: "DEFAULT",
    label: "기본음",
    asset: require("@assets/sounds/default.m4a"),
  },
  { key: "BELL", label: "종소리", asset: require("@assets/sounds/bell.m4a") },
  {
    key: "DROPLET",
    label: "물방울",
    asset: require("@assets/sounds/droplet.m4a"),
  },
  { key: "CHIME", label: "실로폰", asset: require("@assets/sounds/chime.m4a") },
  { key: "SILENT", label: "무음", asset: null },
];

export const DEFAULTS = {
  [SOUND_KEYS.ENABLED]: "ON",
  [SOUND_KEYS.VIBRATION]: "ON",
  [SOUND_KEYS.TONE]: "DEFAULT",
};

// ── 로컬 영구 저장 (MMKV) ──────────────────────────────
// 백엔드 SOUND 설정이 준비되기 전까지 기기에 값을 보관해 두는 용도.
// 백엔드 응답에 SOUND 값이 들어오면 그 값이 우선합니다.
import { mmkv } from "@src/lib/mmkv";

const STORAGE_PREFIX = "soundSetting:";

export const readLocalSound = (settingKey) =>
  mmkv.getString(STORAGE_PREFIX + settingKey) ?? DEFAULTS[settingKey];

export const writeLocalSound = (settingKey, settingValue) =>
  mmkv.set(STORAGE_PREFIX + settingKey, settingValue);
