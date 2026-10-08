import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, FlatList, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useChatRooms } from '@src/hooks/queries/useChatQuery';



export default function ChatSearchModal({ visible, onClose }) {
    const router = useRouter();
    const { data: chatRooms } = useChatRooms();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'ROOM' | 'MESSAGE'
    const [recentSearches, setRecentSearches] = useState(['피그마', '빌드', '회의']);

    // 검색어 제출 시 최근 검색어 저장
    const handleSearchSubmit = () => {
        if (!searchQuery.trim()) return;
        if (!recentSearches.includes(searchQuery.trim())) {
            setRecentSearches([searchQuery.trim(), ...recentSearches.slice(0, 4)]);
        }
    };

    const handleDeleteRecent = (queryToDelete) => {
        setRecentSearches(recentSearches.filter(q => q !== queryToDelete));
    };

    const handleClearAllRecent = () => {
        setRecentSearches([]);
    };

    // 키워드 하이라이팅 렌더링 헬퍼
    const renderHighlightText = (text, query) => {
        if (!query) return <Text>{text}</Text>;
        const parts = text.split(new RegExp(`(${query})`, 'gi'));
        return (
            <Text className="text-sm text-gray-500">
                {parts.map((part, i) => 
                    part.toLowerCase() === query.toLowerCase()
                        ? <Text key={i} className="text-blue-500 font-bold">{part}</Text>
                        : <Text key={i}>{part}</Text>
                )}
            </Text>
        );
    };

    // 검색 필터링 로직
    const queryLower = searchQuery.toLowerCase().trim();
    const filteredRooms = chatRooms?.filter(room => 
        (room.roomName || '').toLowerCase().includes(queryLower) ||
        (room.lastMessage || '').toLowerCase().includes(queryLower)
    ) || [];

    const filteredMessages = chatRooms?.filter(room => 
        room.lastMessage && room.lastMessage.toLowerCase().includes(queryLower)
    ).map((room, idx) => ({
        messageId: `msg_${room.roomId}_${idx}`,
        roomId: room.roomId,
        senderName: '마지막 메시지',
        content: room.lastMessage,
        roomName: room.roomName,
        createdAt: room.updatedAt
    })) || [];

    const handleRoomClick = (roomId) => {
        onClose();
        router.push(`/chat/${roomId}`);
    };

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={false}
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-white pt-12 flex-col">
                {/* 상단 검색바 */}
                <View className="flex-row items-center px-4 py-2.5 border-b border-gray-100">
                    <TouchableOpacity onPress={onClose} className="mr-3">
                        <Ionicons name="arrow-back" size={24} color="#1F2937" />
                    </TouchableOpacity>
                    <View className="flex-1 bg-gray-100 rounded-full flex-row items-center px-4 py-2">
                        <Ionicons name="search" size={18} color="#9CA3AF" className="mr-2" />
                        <TextInput
                            className="flex-1 text-base p-0"
                            placeholder="채팅방 또는 메시지 검색"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            returnKeyType="search"
                            onSubmitEditing={handleSearchSubmit}
                            autoFocus
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {searchQuery.trim() === '' ? (
                    /* 최근 검색어 화면 */
                    <View className="flex-1 p-5">
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="text-sm font-bold text-gray-700">최근 검색어</Text>
                            {recentSearches.length > 0 && (
                                <TouchableOpacity onPress={handleClearAllRecent}>
                                    <Text className="text-xs text-gray-400">전체 삭제</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                        {recentSearches.length === 0 ? (
                            <View className="flex-1 items-center justify-center pt-20">
                                <Text className="text-gray-400 text-sm">최근 검색 기록이 없습니다.</Text>
                            </View>
                        ) : (
                            <View className="flex-row flex-wrap">
                                {recentSearches.map((query, idx) => (
                                    <View key={idx} className="flex-row items-center bg-gray-100 rounded-full px-3 py-1.5 mr-2 mb-2">
                                        <TouchableOpacity onPress={() => setSearchQuery(query)}>
                                            <Text className="text-sm text-gray-700 mr-1.5">{query}</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => handleDeleteRecent(query)}>
                                            <Ionicons name="close" size={14} color="#9CA3AF" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                ) : (
                    /* 검색 결과 화면 */
                    <View className="flex-1 flex-col">
                        {/* 탭 헤더 */}
                        <View className="flex-row border-b border-gray-100 justify-around">
                            {['ALL', 'ROOM', 'MESSAGE'].map((tab) => {
                                const tabLabel = tab === 'ALL' ? '전체' : tab === 'ROOM' ? '채팅방' : '메시지';
                                const isSelected = activeTab === tab;
                                return (
                                    <TouchableOpacity 
                                        key={tab} 
                                        className={`py-3 px-4 border-b-2 ${isSelected ? 'border-blue-500' : 'border-transparent'}`}
                                        onPress={() => setActiveTab(tab)}
                                    >
                                        <Text className={`font-semibold ${isSelected ? 'text-blue-500' : 'text-gray-500'}`}>{tabLabel}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <ScrollView className="flex-1 bg-gray-50">
                            {/* ALL 탭 또는 ROOM 탭 */}
                            {(activeTab === 'ALL' || activeTab === 'ROOM') && (
                                <View className="bg-white mb-2">
                                    <View className="px-4 py-2 bg-gray-50/50">
                                        <Text className="text-xs font-semibold text-gray-400">채팅방 ({filteredRooms.length})</Text>
                                    </View>
                                    {filteredRooms.length === 0 ? (
                                        <View className="p-4 items-center">
                                            <Text className="text-sm text-gray-400">검색된 채팅방이 없습니다.</Text>
                                        </View>
                                    ) : (
                                        filteredRooms.map((room) => (
                                            <TouchableOpacity 
                                                key={room.roomId} 
                                                className="flex-row items-center px-4 py-3 border-b border-gray-50"
                                                onPress={() => handleRoomClick(room.roomId)}
                                            >
                                                {room.avatar ? (
                                                    <Image source={{ uri: room.avatar }} className="w-10 h-10 rounded-full mr-3" />
                                                ) : (
                                                    <View className="w-10 h-10 rounded-full bg-gray-200 mr-3" />
                                                )}
                                                <View className="flex-1">
                                                    <Text className="text-base font-semibold text-gray-800">{room.roomName}</Text>
                                                    <Text className="text-xs text-gray-400 mt-0.5" numberOfLines={1}>
                                                        {room.lastMessage}
                                                    </Text>
                                                </View>
                                            </TouchableOpacity>
                                        ))
                                    )}
                                </View>
                            )}

                            {/* ALL 탭 또는 MESSAGE 탭 */}
                            {(activeTab === 'ALL' || activeTab === 'MESSAGE') && (
                                <View className="bg-white">
                                    <View className="px-4 py-2 bg-gray-50/50">
                                        <Text className="text-xs font-semibold text-gray-400">메시지 ({filteredMessages.length})</Text>
                                    </View>
                                    {filteredMessages.length === 0 ? (
                                        <View className="p-4 items-center">
                                            <Text className="text-sm text-gray-400">검색된 메시지가 없습니다.</Text>
                                        </View>
                                    ) : (
                                        filteredMessages.map((msg) => (
                                            <TouchableOpacity 
                                                key={msg.messageId} 
                                                className="px-4 py-3 border-b border-gray-50"
                                                onPress={() => handleRoomClick(msg.roomId)}
                                            >
                                                <View className="flex-row justify-between items-center mb-1">
                                                    <Text className="text-xs font-semibold text-blue-600">{msg.roomName}</Text>
                                                    <Text className="text-[10px] text-gray-400">{msg.senderName}</Text>
                                                </View>
                                                {renderHighlightText(msg.content, searchQuery)}
                                            </TouchableOpacity>
                                        ))
                                    )}
                                </View>
                            )}
                        </ScrollView>
                    </View>
                )}
            </View>
        </Modal>
    );
}
