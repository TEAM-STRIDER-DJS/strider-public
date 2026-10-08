import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, Keyboard, Image, ScrollView, Alert, ActivityIndicator, Modal, StatusBar, Dimensions, TouchableWithoutFeedback, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@src/store/authStore';
import { useChatStore } from '@src/store/chatStore';
import { getMessagesApi, markAsReadApi, leaveGroupRoomApi } from '@src/api/chatApi';
import { formatImageUrl } from '@src/utils/image';
import { getProfileInfo } from '@src/api/profileApi';
import { useChatRooms, useRoomMembers, useActiveNotice, useNoticeList, useRoomMedia } from '@src/hooks/queries/useChatQuery';
import { useCreateNotice, useUnregisterNotice, useDeleteNotice } from '@src/hooks/mutations/useChatMutation';
import ChatSearchModal from '../components/ChatSearchModal';
import * as ImagePicker from 'expo-image-picker';
import { uploadMediaWithPreview } from '@src/api/mediaApi';
import { saveMediaToLibrary } from '../mediaDownload';
import { useQueryClient } from '@tanstack/react-query';
import {
    MESSAGE_TYPE,
    MEDIA_TYPE,
    MAX_IMAGE_COUNT,
    getMessageType,
    getMediaList,
    getMediaThumbnailUrl,
    generateClientMessageId,
    toMediaItem,
} from '../messageTypes';

const formatTime = (dateString) => {
    if (!dateString) return "";
    let date = new Date(dateString);

    // 잘못된 파싱일 경우 백업 파싱 처리
    if (isNaN(date.getTime()) && typeof dateString === 'string') {
        const cleanStr = dateString.replace(' ', 'T');
        date = new Date(cleanStr);
    }

    if (isNaN(date.getTime())) return "";

    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? '오후' : '오전';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${ampm} ${hours}:${minutes}`;
};

/** 발행 후 이 시간 안에 서버 메시지가 안 오면 실패로 본다 */
const SEND_TIMEOUT_MS = 10000;

const formatDateDivider = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekDays = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    const weekDay = weekDays[date.getDay()];
    return `${year}년 ${month}월 ${day}일 ${weekDay}`;
};

export default function ChatRoomScreen({ roomId }) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const flatListRef = useRef(null);
    const { userId } = useAuthStore();
    const { stompClient, isConnected, messages, setMessages, addMessage, removeMessage, updateMessageStatus, applyReadReceipt, seedReadReceipts, setCurrentRoom, setSubscription, clearRoom } = useChatStore();
    const [inputText, setInputText] = useState('');

    // UI 관련 상태 정의
    const [isNoticeExpanded, setIsNoticeExpanded] = useState(false);
    const [showActionBar, setShowActionBar] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    // 여러 장 업로드 중 진행 표시용 { done, total }
    const [uploadProgress, setUploadProgress] = useState(null);
    // 이미지 풀스크린 뷰어 상태
    const [selectedImageUrl, setSelectedImageUrl] = useState(null);
    const [isDownloading, setIsDownloading] = useState(false);

    // 이미지 갤러리 저장 핸들러 (저장 로직은 미디어 갤러리 뷰어와 공용)
    const handleDownloadImage = async () => {
        if (!selectedImageUrl || isDownloading) return;
        setIsDownloading(true);
        await saveMediaToLibrary(selectedImageUrl);
        setIsDownloading(false);
    };


    /**
     * 발행 후 서버 브로드캐스트가 돌아오지 않으면 말풍선이 'sending'에 영원히 갇힌다.
     * STOMP는 REST와 달리 응답이 없고, 서버가 거부하면 /sub/user/{userId}/error로만 알려 준다.
     * 일정 시간 뒤에도 그대로면 실패로 표시해 재전송/삭제 버튼을 띄운다.
     */
    const markSendTimeout = (tempId) => {
        setTimeout(() => {
            const stillSending = useChatStore.getState().messages.some(
                (m) => (m.messageId || m.id) === tempId && m.status === 'sending'
            );
            if (stillSending) {
                console.warn("[ChatRoomScreen] 서버 응답 없음 → 전송 실패 처리:");
                updateMessageStatus(tempId, 'failed');
            }
        }, SEND_TIMEOUT_MS);
    };

    /**
     * 미디어 말풍선 탭 — 원본을 연다.
     * 이미지는 인앱 뷰어, 영상은 아직 인앱 플레이어가 없어 기기 기본 앱으로 넘긴다.
     */
    const handleOpenMedia = (media) => {
        const url = formatImageUrl(media?.originalUrl);
        if (!url) return;
        if (media.mediaType === MEDIA_TYPE.VIDEO) {
            Linking.openURL(url).catch((err) => {
                console.warn("[ChatRoomScreen] 동영상 열기 실패:");
                Alert.alert('재생 실패', '동영상을 열 수 없습니다.');
            });
            return;
        }
        setSelectedImageUrl(url);
    };

    /**
     * 미디어(이미지/영상) 전송.
     *
     * 서버는 media[] 구성으로 messageType(IMAGE/VIDEO)을 결정하므로
     * content에 URL을 넣어 보내면 안 된다 (TEXT 메시지로 저장된다).
     * 미디어 메시지에 캡션도 붙일 수 없어 content는 항상 빈 문자열이다.
     * — ChatService.validateMessageComposition 참고
     */
    const handlePickImage = async (useCamera = false) => {
        try {
            if (useCamera) {
                const { status } = await ImagePicker.requestCameraPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('권한 필요', '카메라 접근 권한이 필요합니다.');
                    return;
                }
            } else {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('권한 필요', '앨범 접근 권한이 필요합니다.');
                    return;
                }
            }

            const result = useCamera
                ? await ImagePicker.launchCameraAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    quality: 0.8,
                })
                : await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    quality: 0.8,
                    allowsMultipleSelection: true,
                    // 서버는 한 메시지에 이미지 10장까지 받는다 (ChatService.MAX_IMAGE_COUNT)
                    selectionLimit: MAX_IMAGE_COUNT,
                });

            if (result.canceled || !result.assets || result.assets.length === 0) {
                return;
            }

            // selectionLimit을 무시하는 플랫폼이 있어 한 번 더 자른다
            const assets = result.assets.slice(0, MAX_IMAGE_COUNT);
            if (result.assets.length > MAX_IMAGE_COUNT) {
                Alert.alert('알림', `한 번에 ${MAX_IMAGE_COUNT}장까지 보낼 수 있어 앞의 ${MAX_IMAGE_COUNT}장만 전송합니다.`);
            }

            setIsUploading(true);
            setUploadProgress({ done: 0, total: assets.length });

            // 한 장이 실패해도 나머지는 보낸다. Promise.all이면 전부 날아간다.
            const settled = await Promise.allSettled(
                assets.map(async (asset) => {
                    const uploaded = await uploadMediaWithPreview(asset);
                    setUploadProgress((prev) => prev && { ...prev, done: prev.done + 1 });
                    return toMediaItem({
                        mediaType: asset.type === 'video' ? MEDIA_TYPE.VIDEO : MEDIA_TYPE.IMAGE,
                        original: uploaded?.original,
                        preview: uploaded?.preview,
                    });
                })
            );

            settled.forEach((r, idx) => {
                if (r.status === 'rejected') {
                    console.warn("[App] 이벤트 발생");
                }
            });

            // 서버 필수값(mediaType·originalUrl·originalS3Key)이 비면 400으로 거부된다
            const mediaItems = settled
                .filter((r) => r.status === 'fulfilled')
                .map((r) => r.value)
                .filter((m) => m?.originalUrl && m?.originalS3Key);

            if (mediaItems.length === 0) {
                Alert.alert('전송 실패', '이미지 업로드에 실패했습니다.');
                return;
            }
            if (mediaItems.length < assets.length) {
                Alert.alert('일부 실패', `${assets.length}장 중 ${mediaItems.length}장만 전송합니다.`);
            }

            const mediaType = mediaItems[0].mediaType;
            const clientMessageId = generateClientMessageId();

            // 낙관적 UI — 서버 응답과 같은 모양(messageType + media[])으로 만들어 둔다.
            // sortOrder를 채워야 서버 메시지로 교체되기 전에도 순서가 유지된다.
            addMessage({
                messageId: `local_${clientMessageId}`,
                clientMessageId,
                senderId: userId,
                content: '',
                messageType: mediaType === MEDIA_TYPE.VIDEO ? MESSAGE_TYPE.VIDEO : MESSAGE_TYPE.IMAGE,
                media: mediaItems.map((m, idx) => ({ ...m, sortOrder: idx })),
                createdAt: new Date().toISOString(),
                unreadCount: optimisticUnreadCount,
                status: 'sending',
            });

            if (stompClient && stompClient.connected) {
                const body = JSON.stringify({ roomId, content: '', clientMessageId, media: mediaItems });
                console.log("[ChatRoomScreen] 미디어 메시지 발행 payload:");
                stompClient.publish({ destination: "/pub/chat/send", body });
                markSendTimeout(`local_${clientMessageId}`);
            } else {
                console.warn("[ChatRoomScreen] STOMP 미연결 → 미디어 메시지를 'failed' 상태로 표시");
                updateMessageStatus(`local_${clientMessageId}`, 'failed');
            }
        } catch (err) {
            console.error("[ChatRoomScreen] 미디어 전송 실패:");
            Alert.alert('전송 실패', err?.message || '이미지 업로드 중 오류가 발생했습니다.');
        } finally {
            setIsUploading(false);
            setUploadProgress(null);
            setShowActionBar(false);
        }
    };

    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isStarred, setIsStarred] = useState(false);
    const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
    const [isNoticeListModalVisible, setIsNoticeListModalVisible] = useState(false);

    const { data: chatRooms, refetch: refetchRooms } = useChatRooms();
    const { data: roomMembers } = useRoomMembers(roomId);
    const { data: activeNotice } = useActiveNotice(roomId);
    const { data: noticeList } = useNoticeList(roomId);

    const createNoticeMutation = useCreateNotice();
    const unregisterNoticeMutation = useUnregisterNotice();
    const deleteNoticeMutation = useDeleteNotice();

    const currentRoomInfo = chatRooms?.find(room => room.roomId === roomId);
    const roomName = currentRoomInfo?.roomName || '채팅방';
    // 낙관적 unreadCount용 멤버 수. 방 목록 응답의 memberCount가 먼저 도착하므로 그걸 우선 쓰고,
    // 없으면 멤버 목록 길이로 폴백한다.
    const memberCount = currentRoomInfo?.memberCount || roomMembers?.length || 0;
    const optimisticUnreadCount = Math.max(0, memberCount - 1);

    // 공지 등록 핸들러 (메시지 롱 프레스 시)
    const handleCreateNotice = (item) => {
        if (!item) return;

        // 미디어/공지 말풍선은 공지로 등록할 수 없다 (서버 messageType 기준)
        if (getMessageType(item) !== MESSAGE_TYPE.TEXT) {
            Alert.alert('알림', '텍스트 메시지만 공지로 등록할 수 있습니다.');
            return;
        }

        const msgId = item.messageId || item.id;
        if (!msgId) {
            Alert.alert('알림', '공지로 등록할 메시지 ID를 찾을 수 없습니다.');
            return;
        }

        Alert.alert(
            '공지 등록',
            '이 메시지를 채팅방 공지로 등록하시겠습니까?',
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '공지 등록',
                    onPress: () => {
                        createNoticeMutation.mutate(
                            { roomId, messageId: msgId },
                            {
                                onSuccess: () => {
                                    Alert.alert('성공', '공지가 등록되었습니다.');
                                    // 공지 등록 말풍선(messageType: NOTICE)은 서버가 직접 만들어
                                    // /sub/chat/room/{roomId}로 브로드캐스트한다.
                                    // 클라이언트가 같은 문구를 TEXT로 또 발행하면 말풍선이 두 개가 된다.
                                },
                                onError: (err) => {
                                    const errMsg = err?.response?.data?.meta?.message || '공지 등록에 실패했습니다.';
                                    Alert.alert('에러', errMsg);
                                }
                            }
                        );
                    }
                }
            ]
        );
    };

    // 활성 공지 내리기 핸들러
    const handleUnregisterNotice = () => {
        Alert.alert(
            '공지 내리기',
            '현재 상단 공지 배너를 내리시겠습니까?',
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '내리기',
                    style: 'destructive',
                    onPress: () => {
                        unregisterNoticeMutation.mutate(roomId, {
                            onSuccess: () => {
                                Alert.alert('완료', '공지가 내려졌습니다.');
                            },
                            onError: () => {
                                Alert.alert('에러', '공지 내리기에 실패했습니다.');
                            }
                        });
                    }
                }
            ]
        );
    };

    // 공지 완전 삭제 핸들러
    const handleDeleteNotice = (noticeId) => {
        Alert.alert(
            '공지 삭제',
            '이 공지를 목록에서 완전히 삭제하시겠습니까?',
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '삭제',
                    style: 'destructive',
                    onPress: () => {
                        deleteNoticeMutation.mutate(
                            { roomId, noticeId },
                            {
                                onSuccess: () => {
                                    Alert.alert('완료', '공지가 삭제되었습니다.');
                                },
                                onError: (err) => {
                                    const errMsg = err?.response?.data?.meta?.message || '공지 삭제 권한이 없거나 실패했습니다.';
                                    Alert.alert('에러', errMsg);
                                }
                            }
                        );
                    }
                }
            ]
        );
    };

    // 실패 메시지 재전송 핸들러
    const handleResend = (item) => {
        if (!item) return;

        const media = getMediaList(item).map(({ mediaType, originalUrl, originalS3Key, thumbnailUrl, thumbnailS3Key, previewUrl, previewS3Key }) => ({
            mediaType, originalUrl, originalS3Key, thumbnailUrl, thumbnailS3Key, previewUrl, previewS3Key,
        }));
        if (!item.content && media.length === 0) return;

        if (stompClient && stompClient.connected) {
            try {
                console.log("[ChatRoomScreen] 실패 메시지 재전송 시도... 경로: /pub/chat/send");
                // clientMessageId를 그대로 재사용해야 서버가 중복 저장을 막아 준다
                // (원래 발행이 서버에 닿았는지 클라이언트는 알 수 없다)
                stompClient.publish({
                    destination: "/pub/chat/send",
                    body: JSON.stringify({
                        roomId,
                        content: media.length > 0 ? '' : item.content,
                        clientMessageId: item.clientMessageId || generateClientMessageId(),
                        ...(media.length > 0 ? { media } : {}),
                    }),
                });
                const resendId = item.messageId || item.id;
                updateMessageStatus(resendId, 'sending');
                // 재전송도 응답이 없으면 'sending'에 갇히므로 동일하게 타임아웃을 건다
                markSendTimeout(resendId);
            } catch (err) {
                console.error("[ChatRoomScreen] 재전송 실패:");
                Alert.alert('재전송 실패', '서버로 메시지를 재전송하지 못했습니다.');
            }
        } else {
            Alert.alert('연결 에러', '채팅 서버와 연결이 해제되어 있습니다. 잠시 후 다시 시도해 주세요.');
        }
    };

    // 멤버 목록에 lastReadAt이 실려 오면 읽음 기준선으로 사용한다.
    // (없으면 아무 일도 하지 않으므로 서버가 필드를 추가하면 그대로 동작한다)
    useEffect(() => {
        if (!roomMembers?.length) return;
        console.log("[ChatRoomScreen] 멤버 응답 필드 확인:");
        seedReadReceipts(roomMembers);
    }, [roomMembers]);

    const [memberProfiles, setMemberProfiles] = useState({});

    useEffect(() => {
        const fetchAllRequiredProfiles = async () => {
            const newProfiles = { ...memberProfiles };
            let needUpdate = false;

            // 1. 방 구성원 목록의 ID들
            const memberIds = roomMembers?.map(m => m.userId) || [];
            // 2. 현재 메시지 리스트의 발신자 ID들
            const senderIds = messages?.map(m => m.senderId) || [];

            // 아직 프로필 정보가 로드되지 않은 고유 ID 목록 (나의 프로필 정보 포함)
            const targetIds = Array.from(new Set([...memberIds, ...senderIds].filter(id => id && !newProfiles[id])));

            if (targetIds.length > 0) {
                const promises = targetIds.map(async (mId) => {
                    try {
                        const profile = await getProfileInfo({ userId: mId });
                        if (profile) {
                            newProfiles[mId] = {
                                nickname: profile.nickname || profile.memberName || mId,
                                avatar: formatImageUrl(profile.profileImage || profile.profileThumbImage) || null
                            };
                            needUpdate = true;
                        }
                    } catch (err) {
                        console.log("[App] 이벤트 발생");
                    }
                });
                await Promise.all(promises);
                if (needUpdate) {
                    setMemberProfiles(newProfiles);
                }
            }
        };

        if ((roomMembers && roomMembers.length > 0) || (messages && messages.length > 0)) {
            fetchAllRequiredProfiles();
        }
    }, [roomMembers, messages, userId]);

    useEffect(() => {
        if (!roomId) return;

        // 이 effect가 만든 구독만 정리하기 위해 지역 변수로 보관한다.
        // store의 subscription을 cleanup에서 참조하면 effect가 만들어진 시점의 값(최초 마운트 시 null)이
        // 잡혀서 실제 구독이 해제되지 않는다. 그러면 방을 나가도 구독이 살아남아
        //  - 목록/다른 방에 있는데도 /pub/chat/read를 계속 발행해 "안 읽었는데 읽음 처리"가 되고
        //  - 다른 방 메시지에 이전 방의 읽음 이벤트가 적용된다.
        let roomSubs = [];
        let cancelled = false;

        const initRoom = async () => {
            console.log("[App] 이벤트 발생");
            // 읽음 처리
            try {
                await markAsReadApi(roomId);
                console.log('[ChatRoomScreen] 읽음 처리 API 호출 완료');
            } catch (err) {
                console.log("[ChatRoomScreen] 읽음 처리 실패:");
            }
            if (cancelled) return;

            // 이전 메시지 불러오기
            try {
                const res = await getMessagesApi(roomId, { size: 30 });
                if (cancelled) return;
                setMessages(res.data || []);
                // 서버 메시지 필드 구조 확인용 (1개만 출력)
                if (res.data?.length > 0) {
                    const sample = res.data[0];
                    console.log("[ChatRoomScreen] 서버 메시지 필드 구조:");
                }
                console.log("[App] 이벤트 발생");
            } catch (err) {
                console.log("[ChatRoomScreen] 메시지 로드 실패:");
            }
            if (cancelled) return;

            // STOMP 구독
            console.log("[ChatRoomScreen] STOMP 클라이언트 상태 검사... stompClient 존재 여부:");
            if (stompClient && stompClient.connected) {
                console.log("[App] 이벤트 발생");
                const sub = stompClient.subscribe(`/sub/chat/room/${roomId}`, (message) => {
                    const msg = JSON.parse(message.body);
                    console.log("[ChatRoomScreen] STOMP 메시지 수신 - messageId:");
                    addMessage(msg);

                    stompClient.publish({
                        destination: "/pub/chat/read",
                        body: JSON.stringify({ roomId })
                    });
                });

                // 실시간 공지 변경 이벤트 구독
                console.log("[App] 이벤트 발생");
                const noticeSub = stompClient.subscribe(`/sub/chat/room/${roomId}/notice`, (noticeMsg) => {
                    console.log("[ChatRoomScreen] STOMP 실시간 공지 이벤트 수신:");
                    queryClient.invalidateQueries({ queryKey: ["activeNotice", roomId] });
                    queryClient.invalidateQueries({ queryKey: ["noticeList", roomId] });
                });

                // 실시간 읽음(read receipt) 구독 — 다른 멤버가 읽으면 메시지별 미읽음 수를 차감
                console.log("[App] 이벤트 발생");
                const readSub = stompClient.subscribe(`/sub/chat/room/${roomId}/read`, (readMsg) => {
                    try {
                        const receipt = JSON.parse(readMsg.body);
                        console.log("[ChatRoomScreen] STOMP 읽음 이벤트 수신 - userId:");
                        // 내 읽음 이벤트는 반영하지 않는다.
                        // 방에 머무는 동안 도착한 메시지는 서버가 나를 제외하고 unreadCount를 계산해 보내므로
                        // 여기서 또 차감하면 이중 차감이 된다.
                        if (String(receipt.userId) === String(userId)) return;
                        applyReadReceipt(receipt);
                    } catch (e) {
                        console.warn("[ChatRoomScreen] 읽음 이벤트 파싱 실패:");
                    }
                });

                console.log("[ChatRoomScreen] STOMP 입장(enter) 신호 전송 시도... 경로: /pub/chat/enter");
                stompClient.publish({
                    destination: "/pub/chat/enter",
                    body: JSON.stringify({ roomId })
                });

                roomSubs = [sub, noticeSub, readSub];
                setCurrentRoom(roomId);
                setSubscription({ unsubscribe: () => roomSubs.forEach((s) => s?.unsubscribe()) });
            } else {
                console.warn("[ChatRoomScreen] STOMP 클라이언트가 없거나 연결(connected)되지 않아 실시간 메시지 구독 및 입장 신호 발송을 건너뛰었습니다.");
            }
        };

        initRoom();

        return () => {
            console.log("[App] 이벤트 발생");
            // 아직 진행 중인 initRoom이 cleanup 이후에 구독을 걸지 않도록 차단
            cancelled = true;
            if (stompClient && stompClient.connected) {
                console.log("[App] 이벤트 발생");
                stompClient.publish({ destination: "/pub/chat/leave", body: JSON.stringify({ roomId }) });
            }
            console.log("[App] 이벤트 발생");
            roomSubs.forEach((s) => {
                try {
                    s?.unsubscribe();
                } catch (e) {
                    // 소켓이 이미 끊긴 경우는 무시
                }
            });
            roomSubs = [];
            clearRoom();
            queryClient.invalidateQueries({ queryKey: ["chatRooms"] });
        };
        // isConnected를 의존성에 포함해야 소켓이 늦게 연결되거나 재연결됐을 때도 구독이 다시 걸린다.
        // (stompClient는 객체 참조가 그대로라 연결 상태 변화를 잡지 못한다)
    }, [roomId, stompClient, isConnected]);

    const handleSend = () => {
        if (!inputText.trim()) return;

        const textToSend = inputText;
        // 서버가 (roomId, clientMessageId)로 중복 저장을 막고 응답에도 실어 주므로,
        // 이 값으로 낙관 메시지를 서버 메시지와 짝지어 교체한다.
        const clientMessageId = generateClientMessageId();
        const tempId = `local_${clientMessageId}`;
        setInputText('');

        // 1. 즉시 로컬에 'sending' 상태로 표시 (낙관적 UI)
        //    unreadCount는 '나를 뺀 전체 멤버'로 낙관 표기하고,
        //    서버 broadcast가 도착하면 실제 값(방을 보고 있는 멤버 제외)으로 교체된다.
        addMessage({
            messageId: tempId,
            clientMessageId,
            senderId: userId,
            content: textToSend,
            messageType: MESSAGE_TYPE.TEXT,
            createdAt: new Date().toISOString(),
            unreadCount: optimisticUnreadCount,
            status: 'sending'
        });

        const canPublish = stompClient && stompClient.connected;

        if (canPublish) {
            try {
                stompClient.publish({
                    destination: "/pub/chat/send",
                    body: JSON.stringify({ roomId, content: textToSend, clientMessageId }),
                });
                // 2. 전송 성공 → 서버 브로드캐스트 메시지 도착 시 chatStore.addMessage가
                //    같은 clientMessageId의 임시 메시지를 서버 정식 메시지로 교체
                markSendTimeout(tempId);
            } catch (err) {
                console.error("[ChatRoomScreen] STOMP 메시지 발행 실패:");
                // 3. 예외 발생 시 'failed' 상태로 변경 → 재전송/삭제 버튼 표시
                updateMessageStatus(tempId, 'failed');
            }
        } else {
            console.warn("[ChatRoomScreen] STOMP 미연결 → 'failed' 상태로 변경");
            updateMessageStatus(tempId, 'failed');
        }
    };

    const handleLeaveRoom = async () => {
        // 1. STOMP로 퇴장 이벤트 전송 (/pub/chat/leave)
        if (stompClient && stompClient.connected) {
            try {
                console.log("[App] 이벤트 발생");
                stompClient.publish({
                    destination: "/pub/chat/leave",
                    body: JSON.stringify({ roomId }),
                });
            } catch (e) {
                console.warn("[ChatRoomScreen] STOMP 퇴장 이벤트 발행 실패:");
            }
        }

        // 2. 그룹 채팅방(GROUP)인 경우에만 REST API 그룹 퇴장 호출
        if (currentRoomInfo?.roomType === 'GROUP') {
            try {
                await leaveGroupRoomApi(roomId);
            } catch (err) {
                console.log("[ChatRoomScreen] 그룹방 퇴장 API 실패:");
            }
        }

        refetchRooms();
        setIsDrawerOpen(false);
        router.back();
    };

    // 서랍 멤버 목록 매핑 (실데이터 기반)
    const members = roomMembers?.map(m => {
        const isMe = m.userId === userId || m.userId === 1;
        const profile = memberProfiles[m.userId] || {};
        return {
            userId: m.userId,
            nickname: isMe ? '나' : (profile.nickname || `사용자 (${m.userId})`),
            role: 'MEMBER',
            avatar: profile.avatar || null
        };
    }) || [];

    // 서랍 미디어 프리뷰 — 서랍을 열 때만 요청한다.
    // 갤러리 화면과 queryKey를 공유하므로 여기서 받아둔 첫 페이지가 그대로 재사용된다.
    const {
        data: drawerMedia,
        isLoading: isDrawerMediaLoading,
        error: drawerMediaError,
    } = useRoomMedia(roomId, { enabled: isDrawerOpen });
    const drawerMediaPreview = (drawerMedia || []).slice(0, 4);

    const handleOpenMediaGallery = () => {
        setIsDrawerOpen(false);
        router.push(`/chat/${roomId}/media`);
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'bottom']}>
            {/* 헤더 */}
            <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100 z-0">
                <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="chevron-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                {currentRoomInfo?.avatar && (
                    <Image source={{ uri: currentRoomInfo.avatar }} style={{ width: 32, height: 32, borderRadius: 16 }} className="ml-2" />
                )}
                <Text className="text-xl font-bold ml-2">{roomName}</Text>
                <View className="flex-1" />
                <TouchableOpacity className="mr-3" onPress={() => setIsSearchModalVisible(true)}>
                    <Ionicons name="search" size={24} color="#1F2937" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setIsDrawerOpen(true)}>
                    <Ionicons name="menu" size={24} color="#1F2937" />
                </TouchableOpacity>
            </View>

            {/* 공지사항 배너 (1줄 넘는 긴 공지일 때만 접기/펼치기 화살표 표시) */}
            {activeNotice && (() => {
                const isLongNotice = (activeNotice.content?.length > 22) || activeNotice.content?.includes('\n');
                return (
                    <View className="bg-amber-50 border-b border-amber-100 px-4 py-2.5">
                        <View className="flex-row items-center justify-between">
                            <TouchableOpacity
                                className="flex-row items-center flex-1 mr-2"
                                onPress={() => {
                                    if (isLongNotice) setIsNoticeExpanded(!isNoticeExpanded);
                                }}
                                activeOpacity={isLongNotice ? 0.85 : 1}
                            >
                                <Ionicons name="megaphone" size={18} color="#D97706" className="mr-2" />
                                <Text className="text-xs font-bold text-amber-800 mr-2">공지</Text>
                                <Text className="text-xs text-amber-900 flex-1" numberOfLines={isNoticeExpanded ? 100 : 1}>
                                    {activeNotice.content}
                                </Text>
                            </TouchableOpacity>

                            <View className="flex-row items-center gap-1.5">
                                {isLongNotice && (
                                    <TouchableOpacity onPress={() => setIsNoticeExpanded(!isNoticeExpanded)} className="p-1">
                                        <Ionicons name={isNoticeExpanded ? "chevron-up" : "chevron-down"} size={16} color="#78350F" />
                                    </TouchableOpacity>
                                )}

                                <TouchableOpacity onPress={handleUnregisterNotice} className="p-1">
                                    <Ionicons name="close" size={20} color="#78350F" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                );
            })()}

            {/* 대화 메인 바디 */}
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item, index) => item.messageId ? item.messageId.toString() : (item.id ? item.id.toString() : index.toString())}
                    contentContainerStyle={{ paddingVertical: 12 }}
                    inverted
                    renderItem={({ item, index }) => {
                        const isMe = String(item.senderId) === String(userId);
                        const senderProfile = !isMe ? memberProfiles[item.senderId] : null;
                        // 무엇을 그릴지는 content가 아니라 서버가 준 messageType/media로 결정한다
                        const messageType = getMessageType(item);
                        const mediaList = item.deleted ? [] : getMediaList(item);

                        // 날짜 구분선 조건
                        const showDateDivider = index === messages.length - 1 ||
                            (messages[index + 1] && new Date(item.createdAt).toDateString() !== new Date(messages[index + 1].createdAt).toDateString());

                        const dateDivider = showDateDivider ? (
                            <View className="items-center my-4">
                                <View className="bg-gray-200/70 rounded-full px-3 py-1">
                                    <Text className="text-[10px] text-gray-500 font-semibold">
                                        {formatDateDivider(item.createdAt)}
                                    </Text>
                                </View>
                            </View>
                        ) : null;

                        // 공지 등록 말풍선 — 서버가 messageType: NOTICE + noticeId로 내려준다.
                        // 발신자 말풍선이 아니라 가운데 시스템 배지로 표시한다.
                        if (messageType === MESSAGE_TYPE.NOTICE) {
                            return (
                                <View className="flex-col">
                                    {dateDivider}
                                    {/* content에는 공지로 걸린 '원본 메시지 내용'이 들어 있다.
                                        "공지가 등록되었습니다." 머리말과 "글 확인하기"는 서버가 만들지 않고
                                        클라이언트가 messageType == NOTICE를 보고 붙인다. — ChatService 주석 */}
                                    <View className="items-center my-2 px-8">
                                        <TouchableOpacity
                                            activeOpacity={0.8}
                                            onPress={() => setIsNoticeListModalVisible(true)}
                                            className="bg-amber-50 border border-amber-200 rounded-2xl px-3 py-2 w-full"
                                        >
                                            <View className="flex-row items-center">
                                                <Ionicons name="megaphone" size={13} color="#B45309" />
                                                <Text className="text-[11px] text-amber-800 font-bold ml-1.5">
                                                    공지가 등록되었습니다.
                                                </Text>
                                            </View>
                                            {!!item.content && (
                                                <Text className="text-[12px] text-amber-900 mt-1" numberOfLines={2}>
                                                    {item.content}
                                                </Text>
                                            )}
                                            {item.noticeId && (
                                                <Text className="text-[11px] text-amber-900 font-bold mt-1.5">글 확인하기 ›</Text>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            );
                        }

                        return (
                            <View className="flex-col">
                                {dateDivider}

                                <View className={`px-4 py-1.5 flex-row ${isMe ? 'justify-end' : 'justify-start'} items-end`}>
                                    {!isMe && (
                                        <Image
                                            source={
                                                senderProfile?.avatar
                                                    ? { uri: senderProfile.avatar }
                                                    : require('@assets/strider-logo.png')
                                            }
                                            style={{ width: 32, height: 32, borderRadius: 16 }}
                                            className="mr-2 self-start mt-1"
                                        />
                                    )}

                                    <View className={`flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[70%]`}>
                                        {!isMe && (
                                            <Text className="text-[11px] text-gray-500 font-bold mb-1 ml-1">
                                                {senderProfile?.nickname || `사용자 (${item.senderId})`}
                                            </Text>
                                        )}
                                        <View className="flex-row items-end">
                                            {/* 전송 실패 메시지인 경우 재전송 + 삭제 버튼 표시 */}
                                            {isMe && item.status === 'failed' && (
                                                <View className="flex-col items-end gap-1 mr-1.5">
                                                    <TouchableOpacity
                                                        onPress={() => handleResend(item)}
                                                        className="flex-row items-center bg-blue-100 rounded-full px-2 py-0.5"
                                                        activeOpacity={0.7}
                                                    >
                                                        <Ionicons name="refresh" size={12} color="#3B82F6" />
                                                        <Text className="text-[10px] text-blue-600 font-bold ml-0.5">재전송</Text>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        onPress={() => removeMessage(item.messageId || item.id)}
                                                        className="flex-row items-center bg-red-100 rounded-full px-2 py-0.5"
                                                        activeOpacity={0.7}
                                                    >
                                                        <Ionicons name="close-circle" size={12} color="#EF4444" />
                                                        <Text className="text-[10px] text-red-600 font-bold ml-0.5">삭제</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            )}

                                            {isMe && item.status !== 'failed' && (
                                                <View className="items-end mr-1.5">
                                                    {item.unreadCount > 0 && (
                                                        <Text className="text-[10px] text-amber-500 font-bold">{item.unreadCount}</Text>
                                                    )}
                                                    <Text className="text-[9px] text-gray-400">{formatTime(item.createdAt)}</Text>
                                                </View>
                                            )}

                                            {mediaList.length > 0 ? (
                                                <View className={`flex-row flex-wrap max-w-[248px] ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                    {mediaList.map((media, mediaIndex) => {
                                                        const isVideo = media.mediaType === MEDIA_TYPE.VIDEO;
                                                        // 목록에는 작은 이미지(이미지=thumbnail, 영상=preview)를 쓰고
                                                        // 원본은 눌렀을 때만 연다
                                                        const thumbUrl = formatImageUrl(getMediaThumbnailUrl(media));
                                                        const isSingle = mediaList.length === 1;
                                                        const size = isSingle ? 200 : 78;
                                                        return (
                                                            <TouchableOpacity
                                                                key={media.mediaId || `${item.messageId}-${mediaIndex}`}
                                                                activeOpacity={0.85}
                                                                onPress={() => handleOpenMedia(media)}
                                                                className="m-0.5"
                                                            >
                                                                <View className="rounded-2xl overflow-hidden border border-gray-100 bg-gray-100">
                                                                    <Image
                                                                        source={{ uri: thumbUrl }}
                                                                        style={{ width: size, height: size }}
                                                                        resizeMode="cover"
                                                                    />
                                                                    {isVideo && (
                                                                        <View
                                                                            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.25)' }}
                                                                            className="items-center justify-center"
                                                                        >
                                                                            <Ionicons name="play-circle" size={isSingle ? 48 : 24} color="#FFFFFF" />
                                                                        </View>
                                                                    )}
                                                                </View>
                                                            </TouchableOpacity>
                                                        );
                                                    })}
                                                </View>
                                            ) : (
                                                <TouchableOpacity
                                                    activeOpacity={0.8}
                                                    disabled={item.deleted}
                                                    onLongPress={() => handleCreateNotice(item)}
                                                >
                                                    <View className={`rounded-2xl px-4 py-2 ${item.deleted ? 'bg-gray-100 border border-gray-200' : isMe ? 'bg-blue-500 rounded-tr-sm' : 'bg-white rounded-tl-sm border border-gray-100'}`}>
                                                        <Text className={`text-base ${item.deleted ? 'text-gray-400 italic' : isMe ? 'text-white' : 'text-gray-900'}`}>
                                                            {item.content}
                                                        </Text>
                                                    </View>
                                                </TouchableOpacity>
                                            )}

                                            {!isMe && (
                                                <View className="items-start ml-1.5">
                                                    {item.unreadCount > 0 && (
                                                        <Text className="text-[10px] text-amber-500 font-bold">{item.unreadCount}</Text>
                                                    )}
                                                    <Text className="text-[9px] text-gray-400">{formatTime(item.createdAt)}</Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                </View>
                            </View>
                        );
                    }}
                />

                {/* 하단 입력바 */}
                <View className="flex-row items-center px-3 py-2 bg-white border-t border-gray-100">
                    <TouchableOpacity
                        className="w-10 h-10 items-center justify-center"
                        onPress={() => setShowActionBar(!showActionBar)}
                    >
                        <Ionicons name={showActionBar ? "close" : "add"} size={24} color="#9CA3AF" />
                    </TouchableOpacity>
                    <View className="flex-1 bg-gray-100 rounded-full flex-row items-center px-4 mx-2 min-h-[40px] max-h-24 py-1">
                        <TextInput
                            className="flex-1 text-base p-0"
                            style={{ textAlignVertical: 'center', paddingVertical: 0 }}
                            placeholder="메시지 입력"
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                        />
                    </View>
                    <TouchableOpacity
                        onPress={handleSend}
                        className="w-10 h-10 items-center justify-center"
                    >
                        <Ionicons name="send" size={20} color={inputText.trim() ? "#0066FF" : "#9CA3AF"} />
                    </TouchableOpacity>
                </View>

                {/* 미디어 첨부 목업 액션바 */}
                {showActionBar && (
                    <View className="flex-row py-4 px-6 bg-white border-t border-gray-100 justify-around">
                        <TouchableOpacity className="items-center" onPress={() => handlePickImage(false)}>
                            <View className="w-12 h-12 rounded-full bg-blue-50 items-center justify-center mb-1">
                                <Ionicons name="image" size={24} color="#0066FF" />
                            </View>
                            <Text className="text-[10px] text-gray-500">앨범</Text>
                        </TouchableOpacity>
                        <TouchableOpacity className="items-center" onPress={() => handlePickImage(true)}>
                            <View className="w-12 h-12 rounded-full bg-emerald-50 items-center justify-center mb-1">
                                <Ionicons name="camera" size={24} color="#10B981" />
                            </View>
                            <Text className="text-[10px] text-gray-500">카메라</Text>
                        </TouchableOpacity>
                        <TouchableOpacity className="items-center">
                            <View className="w-12 h-12 rounded-full bg-rose-50 items-center justify-center mb-1">
                                <Ionicons name="mic" size={24} color="#EF4444" />
                            </View>
                            <Text className="text-[10px] text-gray-500">음성</Text>
                        </TouchableOpacity>
                        <TouchableOpacity className="items-center">
                            <View className="w-12 h-12 rounded-full bg-amber-50 items-center justify-center mb-1">
                                <Ionicons name="location" size={24} color="#F59E0B" />
                            </View>
                            <Text className="text-[10px] text-gray-500">위치</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </KeyboardAvoidingView>

            {/* 2단계: 우측 슬라이딩 서랍 (Drawer) UI */}
            {isDrawerOpen && (
                <View className="absolute inset-0 flex-row z-50">
                    {/* 외부 영역 클릭 시 닫히는 오버레이 */}
                    <TouchableOpacity
                        className="flex-1 bg-black/40"
                        activeOpacity={1}
                        onPress={() => setIsDrawerOpen(false)}
                    />

                    {/* 서랍 컨텐츠 바디 */}
                    <View className="w-[75%] h-full bg-white shadow-lg pt-12 flex-col">
                        <View className="px-4 pb-3 border-b border-gray-100 flex-row justify-between items-center">
                            <Text className="text-lg font-bold text-gray-900">채팅방 서랍</Text>
                            <TouchableOpacity onPress={() => setIsDrawerOpen(false)}>
                                <Ionicons name="close" size={24} color="#4B5563" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView className="flex-1">
                            {/* 사진/동영상 그리드 */}
                            <View className="p-4 border-b border-gray-100">
                                <TouchableOpacity
                                    className="flex-row justify-between items-center mb-3"
                                    onPress={handleOpenMediaGallery}
                                >
                                    <Text className="text-sm font-bold text-gray-800">사진 / 동영상</Text>
                                    <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                                </TouchableOpacity>
                                <View className="flex-row flex-wrap justify-between">
                                    {/* 실패를 '없음'으로 보여주면 안 된다 — 셋을 구분한다 */}
                                    {isDrawerMediaLoading ? (
                                        <ActivityIndicator size="small" color="#0066FF" />
                                    ) : drawerMediaError ? (
                                        <Text className="text-xs text-gray-400">사진을 불러오지 못했어요.</Text>
                                    ) : drawerMediaPreview.length === 0 ? (
                                        <Text className="text-xs text-gray-400">아직 주고받은 사진이 없어요.</Text>
                                    ) : (
                                        drawerMediaPreview.map((media, idx) => (
                                            <TouchableOpacity
                                                key={media.mediaId || idx}
                                                className="w-[22%] aspect-square"
                                                onPress={handleOpenMediaGallery}
                                            >
                                                <Image
                                                    source={{ uri: formatImageUrl(getMediaThumbnailUrl(media)) }}
                                                    className="w-full h-full rounded-md bg-gray-100"
                                                />
                                                {media.mediaType === MEDIA_TYPE.VIDEO && (
                                                    <View className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-black/60 items-center justify-center">
                                                        <Ionicons name="play" size={8} color="white" style={{ marginLeft: 1 }} />
                                                    </View>
                                                )}
                                            </TouchableOpacity>
                                        ))
                                    )}
                                </View>
                            </View>

                            {/* 게시판 & 공지 */}
                            <TouchableOpacity
                                className="flex-row items-center justify-between p-4 border-b border-gray-100"
                                onPress={() => {
                                    setIsDrawerOpen(false);
                                    setIsNoticeListModalVisible(true);
                                }}
                            >
                                <View className="flex-row items-center">
                                    <Ionicons name="megaphone-outline" size={20} color="#D97706" className="mr-2" />
                                    <Text className="text-sm font-semibold text-gray-800">채팅방 공지 목록</Text>
                                </View>
                                <View className="flex-row items-center">
                                    <Text className="text-xs text-gray-400 mr-1">{noticeList?.length || 0}개</Text>
                                    <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity className="flex-row items-center justify-between p-4 border-b border-gray-100">
                                <View className="flex-row items-center">
                                    <Ionicons name="journal-outline" size={20} color="#4B5563" className="mr-2" />
                                    <Text className="text-sm font-semibold text-gray-800">모임 게시판</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                            </TouchableOpacity>

                            {/* 구성원 리스트 */}
                            <View className="p-4">
                                <Text className="text-sm font-bold text-gray-800 mb-3">모임 구성원</Text>
                                {members.map((member, idx) => (
                                    <View key={idx} className="flex-row items-center justify-between py-2">
                                        <TouchableOpacity
                                            className="flex-row items-center"
                                            onPress={() => {
                                                setIsDrawerOpen(false);
                                                router.push(`/(profile)/${member.userId}/profileInfo`);
                                            }}
                                        >
                                            <Image
                                                source={
                                                    member.avatar
                                                        ? { uri: member.avatar }
                                                        : require('@assets/strider-logo.png')
                                                }
                                                style={{ width: 32, height: 32, borderRadius: 16 }}
                                                className="mr-2.5"
                                            />
                                            <Text className="text-sm font-semibold text-gray-700">{member.nickname}</Text>
                                        </TouchableOpacity>
                                        {member.role === 'LEADER' && (
                                            <View className="bg-amber-100 rounded px-1.5 py-0.5">
                                                <Text className="text-[10px] font-bold text-amber-700">모임장</Text>
                                            </View>
                                        )}
                                    </View>
                                ))}
                            </View>
                        </ScrollView>

                        {/* 하단 제어판 */}
                        <View className="flex-row py-3 border-t border-gray-100 justify-around bg-gray-50 items-center">
                            <TouchableOpacity className="items-center" onPress={() => setIsMuted(!isMuted)}>
                                <Ionicons name={isMuted ? "notifications-off" : "notifications"} size={20} color={isMuted ? "#EF4444" : "#4B5563"} />
                                <Text className="text-[10px] text-gray-500 mt-1">{isMuted ? "알림 켬" : "알림 끔"}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity className="items-center" onPress={() => setIsStarred(!isStarred)}>
                                <Ionicons name={isStarred ? "star" : "star-outline"} size={20} color={isStarred ? "#F59E0B" : "#4B5563"} />
                                <Text className="text-[10px] text-gray-500 mt-1">즐겨찾기</Text>
                            </TouchableOpacity>

                            <TouchableOpacity className="items-center" onPress={handleLeaveRoom}>
                                <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                                <Text className="text-[10px] text-red-500 mt-1">방 나가기</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}
            {isUploading && (
                <View className="absolute inset-0 bg-black/40 z-50 items-center justify-center">
                    <ActivityIndicator size="large" color="#0066FF" />
                    <Text className="text-white font-bold mt-3 text-sm">
                        {uploadProgress && uploadProgress.total > 1
                            ? `이미지 전송 중... (${uploadProgress.done}/${uploadProgress.total})`
                            : '이미지 전송 중...'}
                    </Text>
                </View>
            )}
            <ChatSearchModal
                visible={isSearchModalVisible}
                onClose={() => setIsSearchModalVisible(false)}
            />

            {/* 이미지 풀스크린 뷰어 모달 (카카오톡 스타일) */}
            <Modal
                visible={!!selectedImageUrl}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setSelectedImageUrl(null)}
                statusBarTranslucent={true}
            >
                <StatusBar backgroundColor="black" barStyle="light-content" />
                <TouchableWithoutFeedback onPress={() => setSelectedImageUrl(null)}>
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.97)', justifyContent: 'center', alignItems: 'center' }}>
                        {/* 상단 컨트롤 바: 닫기 + 다운로드 */}
                        <View style={{
                            position: 'absolute', top: 0, left: 0, right: 0,
                            flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                            paddingTop: 52, paddingHorizontal: 16, paddingBottom: 12,
                            zIndex: 10,
                        }}>
                            <TouchableOpacity
                                style={{ padding: 8 }}
                                onPress={() => setSelectedImageUrl(null)}
                            >
                                <Ionicons name="close" size={30} color="white" />
                            </TouchableOpacity>

                            {/* 다운로드(저장) 버튼 */}
                            <TouchableOpacity
                                style={{ padding: 8 }}
                                onPress={handleDownloadImage}
                                disabled={isDownloading}
                            >
                                {isDownloading ? (
                                    <ActivityIndicator size="small" color="white" />
                                ) : (
                                    <Ionicons name="download-outline" size={28} color="white" />
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* 풀스크린 이미지 */}
                        <TouchableWithoutFeedback onPress={() => { }}>
                            <Image
                                source={{ uri: selectedImageUrl }}
                                style={{
                                    width: Dimensions.get('window').width,
                                    height: Dimensions.get('window').height * 0.75,
                                }}
                                resizeMode="contain"
                            />
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            {/* 공지 목록 모달 */}
            <Modal
                visible={isNoticeListModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsNoticeListModalVisible(false)}
            >
                <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-white rounded-t-3xl h-[75%] pt-6 flex-col">
                        <View className="flex-row justify-between items-center px-5 pb-4 border-b border-gray-100">
                            <Text className="text-lg font-bold text-gray-900">채팅방 공지 목록</Text>
                            <TouchableOpacity onPress={() => setIsNoticeListModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#4B5563" />
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            data={noticeList || []}
                            keyExtractor={(item, idx) => item.noticeId || idx.toString()}
                            contentContainerStyle={{ padding: 16 }}
                            renderItem={({ item }) => {
                                const isAuthor = item.registeredBy === userId;
                                return (
                                    <View className="bg-gray-50 rounded-2xl p-4 mb-3 border border-gray-100 flex-col">
                                        <View className="flex-row justify-between items-center mb-2">
                                            <View className="flex-row items-center">
                                                <Ionicons name="megaphone" size={16} color="#D97706" className="mr-1.5" />
                                                <Text className="text-xs font-bold text-amber-800">
                                                    {item.endReason === 'DELETED' ? '삭제됨' : (item.endReason ? '해제됨' : '공지')}
                                                </Text>
                                            </View>
                                            {isAuthor && !item.deleted && (
                                                <TouchableOpacity onPress={() => handleDeleteNotice(item.noticeId)} className="p-1">
                                                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                        <Text className="text-sm text-gray-800 font-medium mb-2">{item.content}</Text>
                                        <View className="flex-row justify-between items-center">
                                            <Text className="text-[10px] text-gray-400">등록자: {item.registeredBy}</Text>
                                            <Text className="text-[10px] text-gray-400">{formatTime(item.createdAt)}</Text>
                                        </View>
                                    </View>
                                );
                            }}
                            ListEmptyComponent={
                                <View className="items-center justify-center py-16">
                                    <Ionicons name="megaphone-outline" size={40} color="#9CA3AF" />
                                    <Text className="text-gray-400 text-sm mt-3">등록된 공지가 없습니다.</Text>
                                </View>
                            }
                        />
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}


