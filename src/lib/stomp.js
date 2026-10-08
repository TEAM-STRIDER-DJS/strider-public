import { requireRuntimeUrl } from "@src/config/runtime";
import { Alert } from "react-native";
import { Client } from "@stomp/stompjs";
import { useChatStore } from "@src/store/chatStore";
import { useAuthStore } from "@src/store/authStore";
import { queryClient } from "@src/lib/queryClient";

let isStompConnecting = false;

/**
 * 사용자 단위 구독 핸들 (방 구독과 달리 앱이 살아 있는 동안 계속 유지된다).
 * 채팅방 목록 화면은 STOMP 구독이 없어서, 목록에 머무는 동안에는
 * 새 메시지가 와도 마지막 메시지/미읽음 수가 갱신되지 않았다.
 * 연결 직후 한 번만 구독해 두고 알림이 오면 목록 쿼리를 무효화한다.
 */
let userSubscriptions = [];

// 메시지가 연달아 오면 목록 조회가 그만큼 반복되므로(방마다 프로필 조회가 붙는다) 짧게 묶어서 처리
let roomListRefreshTimer = null;
const scheduleRoomListRefresh = () => {
    if (roomListRefreshTimer) return;
    roomListRefreshTimer = setTimeout(() => {
        roomListRefreshTimer = null;
        queryClient.invalidateQueries({ queryKey: ["chatRooms"] });
    }, 300);
};

let subscribedUserId = null;

const subscribeUserTopics = (client) => {
    const userId = useAuthStore.getState().userId;
    if (!userId) {
        console.warn("[STOMP] userId가 없어 사용자 단위 구독을 건너뜁니다. 소셜 로그인 경로에서 userId를 저장하는지 확인 필요.");
        return;
    }
    subscribedUserId = userId;

    console.log("[App] 이벤트 발생");
    userSubscriptions.push(
        client.subscribe(`/sub/user/${userId}/notification`, (frame) => {
            try {
                const notif = JSON.parse(frame.body);
                console.log("[STOMP] 알림 수신 - type:");
                if (notif.type === "NEW_MESSAGE") {
                    scheduleRoomListRefresh();
                }
            } catch (e) {
                console.warn("[STOMP] 알림 파싱 실패:");
            }
        })
    );

    // STOMP는 REST와 달리 전송 실패 응답이 없어서 서버 검증 오류를 이 경로로만 받을 수 있다
    console.log("[App] 이벤트 발생");
    userSubscriptions.push(
        client.subscribe(`/sub/user/${userId}/error`, (frame) => {
            try {
                console.warn("[STOMP] 서버 거부 원본:");
                const err = JSON.parse(frame.body);
                // 전송이 조용히 실패하면 원인을 알 방법이 없으므로 화면에 띄운다
                Alert.alert('전송 실패', `[${err.code || '?'}] ${err.message || '서버가 요청을 거부했습니다.'}`);
            } catch (e) {
                console.warn("[STOMP] 에러 페이로드 파싱 실패:");
            }
        })
    );
};

/**
 * 사용자 단위 구독이 걸려 있는지 확인하고 없으면 건다.
 *
 * onConnect에서만 걸면 다음 경우에 누락된다:
 *  - 연결 시점에 userId가 아직 없던 경우 (소셜 로그인 등)
 *  - 개발 중 모듈만 다시 로드돼 기존 연결이 그대로 살아 있는 경우
 * 이 구독이 없으면 서버가 400으로 거부해도 클라이언트는 아무것도 모른다.
 */
export const ensureUserTopics = () => {
    const { stompClient, isConnected } = useChatStore.getState();
    if (!stompClient || !isConnected) return;

    const userId = useAuthStore.getState().userId;
    if (!userId) return;
    if (userSubscriptions.length > 0 && subscribedUserId === userId) return;

    console.log("[STOMP] 사용자 단위 구독이 없어 다시 등록합니다. userId:");
    unsubscribeUserTopics();
    subscribeUserTopics(stompClient);
};

const unsubscribeUserTopics = () => {
    userSubscriptions.forEach((sub) => {
        try {
            sub?.unsubscribe();
        } catch (e) {
            // 이미 소켓이 끊겼으면 무시
        }
    });
    userSubscriptions = [];
    subscribedUserId = null;
    if (roomListRefreshTimer) {
        clearTimeout(roomListRefreshTimer);
        roomListRefreshTimer = null;
    }
};

export const connectStomp = () => {
    const { isConnected, stompClient } = useChatStore.getState();

    // 이미 연결 성공했거나 연결 활성화 작업 중인 경우 중복 호출 방어
    if (isConnected || isStompConnecting) {
        console.log("[STOMP] 이미 연결 상태이거나 연결 시도 중입니다. 중복 요청을 건너뜁니다. isConnected:");
        return;
    }
    // 끊긴 뒤 stompjs가 자동 재연결(reconnectDelay)을 돌리는 중에는 isConnected/isStompConnecting이
    // 모두 false다. 이때 새로 만들면 클라이언트가 두 개가 되어 메시지가 중복 수신된다.
    if (stompClient?.active) {
        console.log("[STOMP] 기존 클라이언트가 자동 재연결 중입니다. 새 연결을 만들지 않습니다.");
        return;
    }
    const accessToken = useAuthStore.getState().accessToken;
    console.log("[STOMP] 연결 시도... AccessToken 존재 여부:");
    if (accessToken) {
        console.log("[STOMP] 토큰 앞 15자리:");
    }
    const brokerURL = requireRuntimeUrl("chatWebSocketUrl");
    isStompConnecting = true;
    const client = new Client({
        brokerURL,
        connectHeaders: {
            Authorization: `Bearer ${accessToken}`,
        },
        forceBinaryWSFrames: true,          // 프레임을 바이너리로 강제
        appendMissingNULLonIncoming: true,  // 누락된 NULL 종결자 보정
        reconnectDelay: 5000,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
        debug: (str) => {
            console.log("[STOMP Debug]");
        },
        onConnect: () => {
            console.log("[STOMP] 연결 성공");
            isStompConnecting = false;
            useChatStore.getState().setIsConnected(true);
            // 자동 재연결 시에도 onConnect가 다시 호출되므로 이전 핸들을 정리하고 다시 건다
            unsubscribeUserTopics();
            subscribeUserTopics(client);
        },
        onDisconnect: () => {
            console.log("[STOMP] 연결 해제");
            isStompConnecting = false;
            unsubscribeUserTopics();
            useChatStore.getState().setIsConnected(false);
        },
        onStompError: (frame) => {
            console.log("[STOMP] 에러 프레임 수신:");
            console.log("[STOMP] 에러 메시지:");
            isStompConnecting = false;
            useChatStore.getState().setIsConnected(false);
        },
        onWebSocketClose: (evt) => {
            console.log("[STOMP] WebSocket 닫힘:");
            isStompConnecting = false;
            unsubscribeUserTopics();
            useChatStore.getState().setIsConnected(false);
        },
        onWebSocketError: (event) => {
            console.log("[STOMP] WebSocket 에러 발생:");
            isStompConnecting = false;
            useChatStore.getState().setIsConnected(false);
        }
    });
    client.activate();
    useChatStore.getState().setStompClient(client);
};

export const disconnectStomp = () => {
    const client = useChatStore.getState().stompClient;
    unsubscribeUserTopics();
    client?.deactivate();
    useChatStore.getState().setStompClient(null);
    useChatStore.getState().setIsConnected(false);
    isStompConnecting = false;
};
