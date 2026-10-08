import { useEffect } from "react";
import { PermissionsAndroid, Platform } from "react-native";
import { useAuthStore } from "@src/store/authStore";
import { registerDeviceTokenApi } from "@src/api/notificationApi";

/**
 * 로그인 상태(userId)가 되면 FCM 토큰을 발급받아 백엔드에 등록.
 * - 최초 발급 토큰 등록 + onTokenRefresh(갱신) 재등록
 * - 여러 로그인 경로(일반/소셜) 및 앱 재시작(persisted userId) 모두 커버
 * - 네이티브 Firebase 미빌드/미설정 환경에서도 앱이 죽지 않도록 방어
 */
export function useFcmRegistration() {
  const userId = useAuthStore((s) => s.userId);

  useEffect(() => {
    if (!userId || Platform.OS === "web") return;

    let unsubscribe;
    let cancelled = false;

    (async () => {
      try {
        // 네이티브 모듈 미탑재 시 여기서 잡히도록 require를 try 안에서
        const messaging = require("@react-native-firebase/messaging").default;

        // Android 13+(API 33+)는 POST_NOTIFICATIONS 런타임 권한이 별도로 필요.
        // messaging().requestPermission()은 Android에서 실제 다이얼로그를 띄우지 않고
        // 그냥 AUTHORIZED를 반환하므로, 이 권한은 명시적으로 요청해야 한다.
        if (Platform.OS === "android" && Platform.Version >= 33) {
          const result = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          );
          if (result !== PermissionsAndroid.RESULTS.GRANTED) return;
        }

        // 알림 권한 요청 (iOS 필수, Android 13+ 도 권장)
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;
        if (!enabled) return;

        // iOS는 getToken 전에 원격 메시지 등록 필요 (APNs 엔타이틀먼트 있어야 성공)
        if (Platform.OS === "ios" && !messaging().isDeviceRegisteredForRemoteMessages) {
          await messaging().registerDeviceForRemoteMessages();
        }

        // 현재 FCM 토큰 등록
        const token = await messaging().getToken();
        if (token && !cancelled) {
          await registerDeviceTokenApi(token);
        }

        // 토큰 갱신 시 재등록 (onNewToken)
        unsubscribe = messaging().onTokenRefresh(async (newToken) => {
          try {
            await registerDeviceTokenApi(newToken);
          } catch (e) {
            console.warn("FCM 토큰 갱신 등록 실패:");
          }
        });
      } catch (e) {
        console.warn("FCM 등록 실패 (네이티브 Firebase 미빌드/미설정일 수 있음):");
      }
    })();

    return () => {
      cancelled = true;
      if (unsubscribe) unsubscribe();
    };
  }, [userId]);
}
