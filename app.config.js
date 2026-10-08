import 'dotenv/config';
const { KAKAO_NATIVE_KEY, NAVER_CLIENT_ID, NAVER_CLIENT_SECRET } = process.env;
const socialSchemes = [
  KAKAO_NATIVE_KEY && `kakao${KAKAO_NATIVE_KEY}`,
  NAVER_CLIENT_ID && `naver${NAVER_CLIENT_ID}`,
].filter(Boolean);
const appIdentifier = process.env.APP_IDENTIFIER || "com.strider.app";
const validateUrl = (name, protocols) => {
  const value = process.env[name]?.trim() || "";
  if (!value) return "";
  const url = new URL(value);
  if (!protocols.includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw new Error(`${name} must be a URL without credentials, query parameters, or fragments.`);
  }
  return value.replace(/\/+$/, "");
};

export default ({ config }) => ({
  ...config,
  plugins: [
    ...(config.plugins ?? []),
    "expo-audio",
    "@react-native-firebase/app",
    "@react-native-firebase/messaging",
    // RNFirebase(iOS): static frameworks 대신 use_modular_headers! 로 Firebase Swift pod 모듈 생성
    "./plugins/withFirebaseModularHeaders",
    // 카카오 Android SDK는 카카오 전용 Maven 저장소에 있음
    [
      "expo-build-properties",
      {
        android: {
          extraMavenRepos: [
            "https://devrepo.kakao.com/nexus/content/groups/public/",
          ],
        },
      },
    ],
    [
      "@kingstinct/react-native-healthkit",
      {
        NSHealthShareUsageDescription: "건강 데이터를 분석하여 맞춤 AI 리포트를 제공합니다.",
        NSHealthUpdateUsageDescription: "건강 데이터를 기록합니다.",
      },
    ],
  ],
  ios: {
    ...config.ios,
    bundleIdentifier: appIdentifier,
    // Firebase 콘솔에서 받은 GoogleService-Info.plist 를 프로젝트 루트에 두기
    googleServicesFile: config.ios?.googleServicesFile ?? "./GoogleService-Info.plist",
    infoPlist: {
      ...(config.ios?.infoPlist ?? {}),
      KAKAO_APP_KEY: KAKAO_NATIVE_KEY,
      CFBundleURLTypes: socialSchemes.map((scheme) => ({ CFBundleURLSchemes: [scheme] })),
      LSApplicationQueriesSchemes: ['kakaokompassauth','kakaolink','kakaotalk','naversearchapp','naversearchthirdlogin']
    }
  },
  android: {
    ...config.android,
    package: appIdentifier,
    // Firebase 콘솔에서 받은 google-services.json (프로젝트 루트)
    googleServicesFile: config.android?.googleServicesFile ?? "./google-services.json",
    metaData: {
      'com.kakao.sdk.AppKey': KAKAO_NATIVE_KEY,
      'com.naver.sdk.AppKey': NAVER_CLIENT_ID
    },
    intentFilters: socialSchemes.length ? [
      {
        action: 'VIEW',
        data: socialSchemes.map((scheme) => ({ scheme })),
        category: ['BROWSABLE','DEFAULT']
      }
    ] : []
  },
  extra: {
    ...config.extra,
    kakaoKey: KAKAO_NATIVE_KEY,
    naverClientId: NAVER_CLIENT_ID,
    naverClientSecret: NAVER_CLIENT_SECRET,
    apiBaseUrl: validateUrl("API_BASE_URL", ["https:", "http:"]),
    chatWebSocketUrl: validateUrl("CHAT_WEBSOCKET_URL", ["wss:", "ws:"]),
    mediaBaseUrl: validateUrl("MEDIA_BASE_URL", ["https:", "http:"]),
    shareBaseUrl: validateUrl("SHARE_BASE_URL", ["https:", "http:"]),
    healthSyncEnabled: process.env.HEALTH_SYNC_ENABLED === "true",
    demoHealthEnabled: process.env.DEMO_HEALTH_ENABLED === "true"
  }
});
