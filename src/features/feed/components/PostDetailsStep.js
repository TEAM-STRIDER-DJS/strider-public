import React, { useState } from 'react';
import {
    View, Text, ScrollView, TextInput, TouchableOpacity,
    Modal, FlatList, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useCreateFeedMutation } from '@src/hooks/mutations/useFeedMutation';
import { useUploadMediaMutation } from '@src/hooks/mutations/useUploadMediaMutation';
import { useExercisesQuery } from '@src/hooks/queries/useExercisesQuery';
import DraggableThumbnails from '@src/features/feed/components/DraggableThumbnails';

export default function PostDetailsStep({ selectedMedia, onBack }) {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    // 삭제/순서변경을 위해 로컬 state로 관리 (id 보장)
    const [mediaList, setMediaList] = useState(() =>
        (selectedMedia ?? []).map((m, i) => ({
            ...m,
            id: m.id ?? `media_${i}_${m.uri}`,
        }))
    );
    const [exercise, setExercise] = useState(null); // { id, nameKo, ... } | null
    const [content, setContent] = useState('');
    const [showExercisePicker, setShowExercisePicker] = useState(false);
    const [isSharing, setIsSharing] = useState(false);

    const { data: exercises = [], isLoading: exercisesLoading } = useExercisesQuery();
    const createFeed = useCreateFeedMutation();
    const uploadMedia = useUploadMediaMutation();

    const handleShare = async () => {
        if (!content.trim() && mediaList.length === 0) {
            Alert.alert('알림', '내용 또는 사진을 추가해주세요.');
            return;
        }

        setIsSharing(true);

        // 1) 미디어 업로드
        let uploadedList;
        try {
            uploadedList = await Promise.all(
                mediaList.map(async (media, idx) => {
                    const filename = media.filename ?? media.uri.split('/').pop();
                    const isVideo = media.mediaType === 'video' || media.mediaType === 'VIDEO';
                    const result = await uploadMedia.mutateAsync({
                        uri: media.uri,
                        type: isVideo ? 'video' : 'image',
                        name: filename,
                    });
                    return {
                        sequence: idx + 1,
                        mediaType: isVideo ? 'VIDEO' : 'IMAGE',
                        fileUrl: result.original.url,
                        thumbnailUrl: result.preview.url,
                    };
                })
            );
        } catch (err) {
            console.error("미디어 업로드 실패:");
            setIsSharing(false); // '업로드 중' 해제 → 다시 시도 가능
            Alert.alert('업로드 실패', '사진/동영상 업로드에 실패했어요. 잠시 후 다시 시도해주세요.');
            return;
        }

        // 2) 피드 등록
        try {
            await createFeed.mutateAsync({
                exerciseId: exercise?.id ?? null,
                review: content.trim(),
                mediaList: uploadedList,
            });
            router.replace('/(tabs)/feed');
        } catch (err) {
            console.error("피드 등록 실패:");
            setIsSharing(false); // '업로드 중' 해제 → 다시 시도 가능
            Alert.alert('등록 실패', '게시물 등록에 실패했어요. 다시 시도해주세요.');
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
            {/* 상단 바 */}
            <View style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                paddingHorizontal: 16, paddingVertical: 12,
            }}>
                <TouchableOpacity onPress={() => onBack(mediaList)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="chevron-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={{ fontSize: 17, fontWeight: '600', color: '#000' }}>새 게시물</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {/* 선택된 미디어 썸네일 — 삭제(X) / 길게 눌러 순서 변경 */}
                {mediaList.length > 0 && (
                    <View style={{ paddingTop: 8, paddingBottom: 4 }}>
                        <DraggableThumbnails media={mediaList} onChange={setMediaList} />
                        <Text style={{ fontSize: 11, color: '#9FA4B0', paddingHorizontal: 16, marginTop: 2 }}>
                            사진을 길게 눌러 순서를 바꾸거나, X를 눌러 삭제할 수 있어요.
                        </Text>
                    </View>
                )}

                <View style={{ height: 1, backgroundColor: '#F0F0F0' }} />

                {/* 운동 종류 */}
                <View style={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 4 }}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: '#000', marginBottom: 4 }}>
                        오늘은 어떤 운동을 완료하셨나요?
                    </Text>
                    <Text style={{ fontSize: 12, color: '#9FA4B0', marginBottom: 12 }}>
                        운동을 선택하면 내 기록에 포함됩니다.
                    </Text>
                    <TouchableOpacity
                        onPress={() => setShowExercisePicker(true)}
                        style={{
                            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                            borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8,
                            paddingHorizontal: 14, paddingVertical: 12,
                        }}
                    >
                        <Text style={{ fontSize: 15, color: exercise ? '#000' : '#9FA4B0' }}>
                            {exercise?.nameKo || '운동을 선택하세요'}
                        </Text>
                        <Ionicons name="chevron-down" size={18} color="#9FA4B0" />
                    </TouchableOpacity>
                </View>

                {/* 운동 소감 */}
                <View style={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 4 }}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: '#000', marginBottom: 12 }}>
                        오늘 운동은 어땠나요?
                    </Text>
                    <TextInput
                        value={content}
                        onChangeText={setContent}
                        placeholder="오늘 운동은 어땠나요? 기록을 남겨보세요."
                        placeholderTextColor="#9FA4B0"
                        multiline
                        style={{
                            minHeight: 100, borderWidth: 1, borderColor: '#E5E7EB',
                            borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12,
                            fontSize: 14, color: '#000', textAlignVertical: 'top',
                        }}
                    />
                </View>

                {/* 공유 버튼 */}
                <View style={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 40 }}>
                    <TouchableOpacity
                        onPress={handleShare}
                        disabled={isSharing}
                        style={{
                            backgroundColor: isSharing ? '#A0AAFF' : '#6178FD',
                            borderRadius: 12, paddingVertical: 16,
                            alignItems: 'center', justifyContent: 'center',
                            flexDirection: 'row', gap: 8,
                        }}
                    >
                        {isSharing && <ActivityIndicator size="small" color="#fff" />}
                        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
                            {isSharing ? '업로드 중...' : '공유'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* 운동 선택 모달 */}
            <Modal visible={showExercisePicker} animationType="slide" transparent>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
                    <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '70%' }}>
                        <View style={{
                            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                            paddingHorizontal: 16, paddingVertical: 16,
                            borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
                        }}>
                            <Text style={{ fontSize: 16, fontWeight: '700', color: '#000' }}>운동 선택</Text>
                            <TouchableOpacity onPress={() => setShowExercisePicker(false)}>
                                <Ionicons name="close" size={22} color="#000" />
                            </TouchableOpacity>
                        </View>
                        {exercisesLoading ? (
                            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                                <ActivityIndicator color="#6178FD" />
                            </View>
                        ) : (
                            <FlatList
                                data={exercises}
                                keyExtractor={item => item.id}
                                contentContainerStyle={{ paddingBottom: insets.bottom + 12 }}
                                ListEmptyComponent={
                                    <Text style={{ textAlign: 'center', color: '#9FA4B0', paddingVertical: 30, fontSize: 14 }}>
                                        운동 목록을 불러오지 못했어요.
                                    </Text>
                                }
                                renderItem={({ item }) => {
                                    const selected = exercise?.id === item.id;
                                    return (
                                        <TouchableOpacity
                                            onPress={() => { setExercise(item); setShowExercisePicker(false); }}
                                            style={{
                                                paddingHorizontal: 16, paddingVertical: 14,
                                                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                                                borderBottomWidth: 1, borderBottomColor: '#F6F7F9',
                                            }}
                                        >
                                            <Text style={{ fontSize: 15, color: selected ? '#6178FD' : '#000', fontWeight: selected ? '600' : '400' }}>
                                                {item.nameKo}
                                            </Text>
                                            {selected && <Ionicons name="checkmark" size={18} color="#6178FD" />}
                                        </TouchableOpacity>
                                    );
                                }}
                            />
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
