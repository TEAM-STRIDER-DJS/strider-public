import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, FlatList, Image, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createGroupRoomApi } from '@src/api/chatApi';
import { getFollowersApi } from '@src/api/followApi';
import { useAuthStore } from '@src/store/authStore';
import { formatImageUrl } from '@src/utils/image';

export default function CreateGroupModal({ visible, onClose, onSuccess }) {
    const { userId } = useAuthStore();
    const [roomName, setRoomName] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);
    const [friends, setFriends] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (visible && userId) {
            const fetchFriends = async () => {
                setIsLoading(true);
                try {
                    const data = await getFollowersApi(userId);
                    setFriends(data || []);
                } catch (err) {
                    console.log("팔로워 목록 로드 실패:");
                } finally {
                    setIsLoading(false);
                }
            };
            fetchFriends();
        }
    }, [visible, userId]);

    const toggleSelectFriend = (userId) => {
        if (selectedIds.includes(userId)) {
            setSelectedIds(selectedIds.filter(id => id !== userId));
        } else {
            setSelectedIds([...selectedIds, userId]);
        }
    };

    const handleCreate = async () => {
        if (!roomName.trim()) {
            Alert.alert('알림', '채팅방 이름을 입력해주세요.');
            return;
        }
        if (selectedIds.length === 0) {
            Alert.alert('알림', '초대할 멤버를 최소 1명 이상 선택해주세요.');
            return;
        }

        try {
            const res = await createGroupRoomApi(roomName, selectedIds);
            if (res.data) {
                Alert.alert('성공', `그룹 채팅방 '${roomName}'이 생성되었습니다!`);
                onSuccess(); // 목록 리프레시 트리거
                handleClose();
            }
        } catch (err) {
            console.log("그룹 방 생성 실패:");
            Alert.alert('에러', '그룹 채팅방 생성에 실패했습니다.');
        }
    };

    const handleClose = () => {
        setRoomName('');
        setSelectedIds([]);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={handleClose}
        >
            <View className="flex-1 bg-black/50 justify-end">
                <View className="bg-white rounded-t-3xl h-[85%] pt-6 flex-col">
                    {/* 모달 헤더 */}
                    <View className="flex-row justify-between items-center px-5 pb-4 border-b border-gray-100">
                        <TouchableOpacity onPress={handleClose}>
                            <Text className="text-gray-500 text-base font-semibold">취소</Text>
                        </TouchableOpacity>
                        <Text className="text-lg font-bold text-gray-900">그룹 채팅방 만들기</Text>
                        <TouchableOpacity onPress={handleCreate}>
                            <Text className={`text-base font-bold ${roomName.trim() && selectedIds.length > 0 ? 'text-blue-500' : 'text-gray-300'}`}>만들기</Text>
                        </TouchableOpacity>
                    </View>

                    {/* 채팅방 이름 입력창 */}
                    <View className="px-5 py-4 border-b border-gray-100">
                        <Text className="text-sm font-semibold text-gray-700 mb-2">채팅방 이름</Text>
                        <TextInput
                            className="bg-gray-50 rounded-xl px-4 py-3 text-base border border-gray-100"
                            placeholder="예) 스트라이더 기획팀 회의실"
                            value={roomName}
                            onChangeText={setRoomName}
                        />
                    </View>

                    {/* 친구 목록 선택 영역 */}
                    <View className="flex-1 px-5 pt-4">
                        <View className="flex-row justify-between items-center mb-3">
                            <Text className="text-sm font-semibold text-gray-700">멤버 선택</Text>
                            <Text className="text-xs text-gray-400">선택됨: {selectedIds.length}명</Text>
                        </View>
                        
                        <FlatList
                            data={friends}
                            keyExtractor={(item, index) => {
                                const fId = item.userId || item.memberId || item.id || item.follower?.userId || item.follower?.memberId || index.toString();
                                return fId.toString();
                            }}
                            renderItem={({ item, index }) => {
                                const fId = item.userId || item.memberId || item.id || item.follower?.userId || item.follower?.memberId || index.toString();
                                const fNickname = item.nickname || item.name || item.follower?.nickname || `사용자 (${fId})`;
                                const fAvatar = formatImageUrl(item.profileImage || item.profileThumbImage || item.avatar || item.follower?.profileImage);
                                
                                const isSelected = selectedIds.includes(fId);
                                return (
                                    <TouchableOpacity 
                                        className="flex-row items-center py-3 border-b border-gray-50 justify-between"
                                        onPress={() => toggleSelectFriend(fId)}
                                    >
                                        <View className="flex-row items-center">
                                            {fAvatar ? (
                                                <Image source={{ uri: fAvatar }} style={{ width: 40, height: 40, borderRadius: 20 }} className="mr-3" />
                                            ) : (
                                                <View className="w-10 h-10 rounded-full bg-gray-200 mr-3" />
                                            )}
                                            <Text className="text-base font-semibold text-gray-800">{fNickname}</Text>
                                        </View>
                                        <View className={`w-6 h-6 rounded-full border items-center justify-center ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300 bg-white'}`}>
                                            {isSelected && (
                                                <Ionicons name="checkmark" size={16} color="white" />
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                );
                            }}
                            ListEmptyComponent={
                                <View className="flex-1 items-center justify-center mt-10">
                                    <Text className="text-gray-400 text-sm">
                                        {isLoading ? '로딩 중...' : '초대 가능한 팔로워가 없습니다.'}
                                    </Text>
                                </View>
                            }
                        />
                    </View>
                </View>
            </View>
        </Modal>
    );
}
