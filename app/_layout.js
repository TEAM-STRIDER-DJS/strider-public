import { Stack } from "expo-router";
import { GluestackUIProvider } from "@gluestack-ui/themed";
import { config } from "../gluestack-style.config";

import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@src/lib/queryClient";
import { useFcmRegistration } from "@src/hooks/useFcmRegistration";
import { useChatSocket } from "@src/hooks/useChatSocket";
import "../global.css";

export default function RootLayout() {
  // 로그인 시 FCM 토큰 발급·등록 (userId 세팅되면 자동 실행)
  useFcmRegistration();
  // 앱 부팅/포그라운드 복귀 시 채팅 소켓 연결 보장
  useChatSocket();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <GluestackUIProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <Stack screenOptions={{ headerShown: false }} />
          </QueryClientProvider>
        </GluestackUIProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}