import { getShareUrl } from "@src/config/runtime";
import React, { useState, forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
import { View, Text, Image, TextInput, Share, Platform, Alert, ToastAndroid, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons, Octicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Pressable } from '@gluestack-ui/themed';
import CustomBottomSheet from '@src/components/ui/CustomBottomSheet';
import { useAuthStore } from '@src/store/authStore';
import { getFollowRelationsApi } from '@src/api/followApi';
import { formatImageUrl } from '@src/utils/image';

const showToast = (msg) => {
    if (Platform.OS === 'android') ToastAndroid.show(msg, ToastAndroid.SHORT);
    else alert(msg);
};

const ShareBottomSheet = forwardRef(({ snapPoints, onClose }, ref) => {
    const bottomSheetRef = useRef(null);
    const { userId } = useAuthStore();
    const [postId, setPostId] = useState(null);
    const [copied, setCopied] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    
    // 친구(팔로우 관계) 목록 상태 관리
    const [friends, setFriends] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useImperativeHandle(ref, () => ({
        present: (id) => {
            setPostId(id);
            setCopied(false);
            bottomSheetRef.current?.present();
            if (userId) {
                loadFriendsList();
            }
        },
        dismiss: () => bottomSheetRef.current?.dismiss(),
    }));

    const loadFriendsList = async () => {
        setIsLoading(true);
        try {
            const data = await getFollowRelationsApi(userId);
            setFriends(data || []);
        } catch (e) {
            console.error("공유 대상 친구 목록 로드 실패:");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyLink = async () => {
        if (!postId) return;
        try {
            await Clipboard.setStringAsync(getShareUrl(postId));
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (e) {
            showToast('링크를 복사하지 못했습니다.');
        }
    };

    const handleNativeShare = async () => {
        try {
            await Share.share({
                message: `스트라이더에서 이 피드를 확인해보세요!\n${getShareUrl(postId)}`,
            });
        } catch (e) {
            console.error("[App] 이벤트 발생");
        }
    };

    // 선택한 친구에게 앱 내 다이렉트 메시지로 링크 공유 전송 기능 추가
    const handleShareToFriend = (friend) => {
        Alert.alert(
            '피드 공유',
            `'${friend.nickname || '사용자'}' 님에게 이 피드 링크를 전송할까요?`,
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '전송',
                    onPress: () => {
                        showToast('메시지로 공유가 완료되었습니다.');
                        bottomSheetRef.current?.dismiss();
                    }
                }
            ]
        );
    };

    // 검색어 필터링
    const filteredFriends = friends.filter(friend => {
        const name = (friend.nickname || friend.name || '').toLowerCase();
        return name.includes(searchQuery.toLowerCase().trim());
    });

    const renderUserItem = ({ item }) => {
        const displayAvatar = formatImageUrl(item.profileImage || item.profileThumbImage);
        return (
            <TouchableOpacity 
                className="items-center mb-6" 
                style={{ width: '33.33%' }}
                onPress={() => handleShareToFriend(item)}
            >
                {displayAvatar ? (
                    <Image
                        source={{ uri: displayAvatar }}
                        className="w-16 h-16 rounded-full border border-gray-100"
                    />
                ) : (
                    <Image
                        source={require('@assets/strider-logo.png')}
                        className="w-16 h-16 rounded-full border border-gray-100"
                    />
                )}
                <Text className="text-xs text-center mt-2 text-gray-800 px-2" numberOfLines={1}>
                    {item.nickname || '사용자'}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <CustomBottomSheet
            ref={bottomSheetRef}
            snapPoints={snapPoints}
            onClose={onClose}
        >
            <View className="flex-1">
                <View className="px-4 py-3">
                    <View className="flex-row items-center bg-gray-100 rounded-xl px-3 py-2">
                        <Ionicons name="search" size={18} color="#9CA3AF" />
                        <TextInput
                            placeholder="검색"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            className="flex-1 ml-2 text-sm text-gray-800 py-0"
                        />
                    </View>
                </View>

                {isLoading ? (
                    <View className="flex-1 items-center justify-center py-10">
                        <ActivityIndicator size="small" color="#6178FD" />
                    </View>
                ) : (
                    <FlatList
                        data={filteredFriends}
                        keyExtractor={(item, index) => item.userId || String(index)}
                        renderItem={renderUserItem}
                        numColumns={3}
                        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 10 }}
                        ListEmptyComponent={
                            <View className="flex-1 items-center justify-center py-10">
                                <Text className="text-gray-400 text-sm">공유 가능한 친구가 없습니다.</Text>
                            </View>
                        }
                    />
                )}

                <View className="flex-row border-t border-gray-100 px-6 py-6 pb-10">
                    <View className="items-center mr-8">
                        <Pressable
                            onPress={handleCopyLink}
                            className={`w-16 h-16 rounded-full items-center justify-center ${copied ? 'bg-green-100' : 'bg-gray-100'}`}
                        >
                            <Octicons name={copied ? "check" : "link"} size={24} color={copied ? "#10B981" : "#1F2937"} />
                        </Pressable>
                        <Text className="text-xs mt-2 text-gray-600 font-medium">
                            {copied ? '복사됨' : '링크 복사'}
                        </Text>
                    </View>

                    <View className="items-center">
                        <Pressable
                            onPress={handleNativeShare}
                            className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center"
                        >
                            <Octicons name="share" size={24} color="#1F2937" />
                        </Pressable>
                        <Text className="text-xs mt-2 text-gray-600 font-medium">공유 대상...</Text>
                    </View>
                </View>
            </View>
        </CustomBottomSheet>
    );
});

export default ShareBottomSheet;
