import { useEffect } from "react";
import { AppState } from "react-native";
import { useAuthStore } from "@src/store/authStore";
import { useChatStore } from "@src/store/chatStore";
import { connectStomp, ensureUserTopics } from "@src/lib/stomp";

/**
 * 앱 부팅/포그라운드 복귀 시 채팅 소켓을 보장한다.
 *
 * 기존에는 connectStomp()가 로그인 뮤테이션에서만 호출돼서,
 * 토큰이 남아 있는 상태로 앱을 다시 켜면 소켓이 아예 붙지 않았다.
 * 그러면 채팅방 목록 실시간 갱신(/sub/user/{userId}/notification)도,
 * 방 안의 메시지/읽음 구독도 전부 동작하지 않는다.
 *
 * connectStomp 자체가 중복 연결을 막으므로 여러 번 불러도 안전하다.
 */
export const useChatSocket = () => {
    const accessToken = useAuthStore((s) => s.accessToken);
    const userId = useAuthStore((s) => s.userId);
    const isConnected = useChatStore((s) => s.isConnected);

    useEffect(() => {
        if (!accessToken || !userId) return;

        const ensureConnected = () => {
            const { isConnected } = useChatStore.getState();
            if (isConnected) {
                // 이미 붙어 있어도 사용자 단위 구독(알림/에러)이 빠져 있을 수 있다
                ensureUserTopics();
                return;
            }
            console.log("[useChatSocket] 채팅 소켓 연결 보장 시도");
            connectStomp();
        };

        ensureConnected();

        const sub = AppState.addEventListener("change", (nextState) => {
            if (nextState === "active") {
                console.log("[useChatSocket] 포그라운드 복귀 - 소켓 상태 점검");
                ensureConnected();
            }
        });

        return () => sub.remove();
    }, [accessToken, userId, isConnected]);
};
