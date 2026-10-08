import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useChatRooms } from '@src/hooks/queries/useChatQuery';
import CreateGroupModal from '../components/CreateGroupModal';
import ChatSearchModal from '../components/ChatSearchModal';

const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? '오후' : '오전';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${ampm} ${hours}:${minutes}`;
};

const formatRoomDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    
    const isToday = now.toDateString() === date.toDateString();
    
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = yesterday.toDateString() === date.toDateString();

    if (isToday) {
        return formatTime(dateString);
    } else if (isYesterday) {
        return "어제";
    } else {
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays <= 7) {
            return `${diffDays}일 전`;
        }
        return `${date.getMonth() + 1}월 ${date.getDate()}일`;
    }
};

export default function ChatListScreen() {
    const router = useRouter();
    const { data: chatRooms, isLoading, refetch } = useChatRooms();
    const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
    const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);

    // 화면 포커스 시 채팅 목록 데이터 새로고침
    useFocusEffect(
        useCallback(() => {
            console.log("[ChatListScreen] 화면 포커스 감지 - 채팅 목록 갱신");
            refetch();
        }, [refetch])
    );

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
            <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
                <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="chevron-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text className="text-xl font-bold ml-2">채팅</Text>
                <View className="flex-1" />
                <TouchableOpacity className="mr-3" onPress={() => setIsSearchModalVisible(true)}>
                    <Ionicons name="search" size={24} color="#1F2937" />
                </TouchableOpacity>
                <TouchableOpacity className="mr-3" onPress={() => setIsCreateModalVisible(true)}>
                    <Ionicons name="chatbubbles-outline" size={24} color="#1F2937" />
                </TouchableOpacity>
                <TouchableOpacity>
                    <Ionicons name="settings-outline" size={24} color="#1F2937" />
                </TouchableOpacity>
            </View>
            <View className="flex-1">
                {isLoading ? (
                    <View className="flex-1 items-center justify-center">
                        <Text className="text-gray-400">로딩 중...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={chatRooms || []}
                        keyExtractor={(item) => item.roomId.toString()}
                        renderItem={({ item }) => {
                            const isDirect = item.roomType === 'DIRECT';
                            return (
                                <TouchableOpacity 
                                    className="flex-row items-center px-4 py-3 border-b border-gray-50"
                                    onPress={() => router.push(`/chat/${item.roomId}`)}
                                >
                                    {item.avatar ? (
                                        <Image source={{ uri: item.avatar }} style={{ width: 48, height: 48, borderRadius: 24 }} className="mr-3" />
                                    ) : (
                                        isDirect ? (
                                            <Image source={require('@assets/strider-logo.png')} style={{ width: 48, height: 48, borderRadius: 24 }} className="mr-3" />
                                        ) : (
                                            <View className="w-12 h-12 rounded-full bg-gray-100 mr-3 items-center justify-center">
                                                <Ionicons name="people" size={24} color="#9CA3AF" />
                                            </View>
                                        )
                                    )}
                                    <View className="flex-1">
                                        <View className="flex-row justify-between items-center mb-1">
                                            <Text className="text-base font-bold text-gray-900" numberOfLines={1}>
                                                {item.roomName}
                                            </Text>
                                            <Text className="text-xs text-gray-400">
                                                {formatRoomDate(item.updatedAt)}
                                            </Text>
                                        </View>
                                        <View className="flex-row justify-between items-center">
                                            <Text className="text-sm text-gray-500 flex-1 mr-2" numberOfLines={1}>
                                                {item.lastMessage || '메시지가 없습니다.'}
                                            </Text>
                                            {item.unreadCount > 0 && (
                                                <View className="bg-red-500 min-w-[20px] h-5 rounded-full px-1.5 items-center justify-center">
                                                    <Text className="text-white text-xs font-bold">{item.unreadCount}</Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        }}
                        ListEmptyComponent={
                            <View className="flex-1 items-center justify-center mt-20">
                                <Text className="text-gray-400">참여 중인 채팅방이 없습니다.</Text>
                            </View>
                        }
                    />
                )}
            </View>
            <CreateGroupModal 
                visible={isCreateModalVisible} 
                onClose={() => setIsCreateModalVisible(false)} 
                onSuccess={refetch} 
            />
            <ChatSearchModal 
                visible={isSearchModalVisible} 
                onClose={() => setIsSearchModalVisible(false)} 
            />
        </SafeAreaView>
    );
}
