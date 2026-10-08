import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, FlatList, Image, TouchableOpacity,
    Dimensions, ActivityIndicator, Alert,
} from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { VideoView, useVideoPlayer } from 'expo-video';
import * as VideoThumbnails from 'expo-video-thumbnails';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLS = 4;
const ITEM_SIZE = SCREEN_WIDTH / COLS;

// 영상 여부 판별
const isVideoAsset = (a) =>
    a?.mediaType === 'video' || a?.mediaType === MediaLibrary.MediaType.video;

export default function MediaPickerStep({ onNext, initialSelected = [] }) {
    const router = useRouter();
    const [permission, requestPermission] = MediaLibrary.usePermissions();
    const [assets, setAssets] = useState([]);
    // 이전 단계에서 선택했던 항목 복원
    const [selected, setSelected] = useState(initialSelected);
    const [isMultiSelect, setIsMultiSelect] = useState(initialSelected.length > 1);
    const [preview, setPreview] = useState(initialSelected[initialSelected.length - 1] ?? null);
    const [endCursor, setEndCursor] = useState(null);
    const [hasNextPage, setHasNextPage] = useState(true);
    const [loading, setLoading] = useState(true);
    // 영상 미리보기용 재생 URI (ph:// → file:// 변환된 값)
    const [previewVideoUri, setPreviewVideoUri] = useState(null);

    const videoPlayer = useVideoPlayer(null, (p) => {
        p.loop = true;
        p.muted = true;
    });

    // 미리보기가 영상으로 바뀌면 file:// 경로 해석 후 재생
    useEffect(() => {
        let cancelled = false;
        (async () => {
            if (preview && isVideoAsset(preview)) {
                const resolved = await resolveLocalUri(preview);
                if (cancelled) return;
                setPreviewVideoUri(resolved.uri);
                try {
                    videoPlayer.replace({ uri: resolved.uri });
                    videoPlayer.play();
                } catch (e) {
                    console.warn("영상 미리보기 실패:");
                }
            } else {
                setPreviewVideoUri(null);
                try { videoPlayer.pause(); } catch (e) {}
            }
        })();
        return () => { cancelled = true; };
    }, [preview?.id]);

    useEffect(() => {
        if (permission?.granted) {
            loadAssets();
        } else if (permission && !permission.granted) {
            if (permission.canAskAgain) {
                requestPermission();
            } else {
                Alert.alert('권한 필요', '설정에서 사진 접근 권한을 허용해주세요.');
                setLoading(false);
            }
        }
    }, [permission]);

    const loadAssets = useCallback(async (after = null) => {
        if (!hasNextPage && after) return;
        const result = await MediaLibrary.getAssetsAsync({
            first: 40,
            after: after ?? undefined,
            mediaType: [MediaLibrary.MediaType.photo, MediaLibrary.MediaType.video],
            sortBy: [MediaLibrary.SortBy.creationTime],
        });
        setAssets(prev => after ? [...prev, ...result.assets] : result.assets);
        setHasNextPage(result.hasNextPage);
        setEndCursor(result.endCursor);
        setLoading(false);
        if (!after && result.assets.length > 0) {
            // 복원된 미리보기가 없을 때만 첫 사진으로 (선택은 안함)
            setPreview(prev => prev ?? result.assets[0]);
        }
    }, [hasNextPage]);

    const handleTap = (asset) => {
        if (!isMultiSelect) {
            setSelected([asset]);
            setPreview(asset);
            return;
        }
        const idx = selected.findIndex(a => a.id === asset.id);
        if (idx !== -1) {
            // 이미 선택됨 → 선택 해제
            const next = selected.filter(a => a.id !== asset.id);
            setSelected(next);
            setPreview(next.length > 0 ? next[next.length - 1] : assets[0] ?? null);
        } else if (selected.length < 10) {
            // 미선택 → 추가
            setSelected(prev => [...prev, asset]);
            setPreview(asset);
        }
    };

    const toggleMultiSelect = () => {
        const next = !isMultiSelect;
        setIsMultiSelect(next);
        if (!next && selected.length > 1) {
            setSelected([selected[0]]);
            setPreview(selected[0]);
        }
    };

    const handleCameraPress = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('권한 필요', '카메라 접근 권한이 필요합니다.');
            return;
        }
        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images', 'videos'],
            quality: 0.9,
        });
        if (!result.canceled) {
            const newAsset = {
                id: `cam_${Date.now()}`,
                uri: result.assets[0].uri,
                mediaType: 'photo',
            };
            if (!isMultiSelect) {
                setSelected([newAsset]);
            } else {
                setSelected(prev => [...prev, newAsset].slice(0, 10));
            }
            setPreview(newAsset);
        }
    };

    // ph:// (iOS Photos) URI는 업로드 불가 → 실제 file:// 경로로 변환
    const resolveLocalUri = async (asset) => {
        if (!asset?.uri?.startsWith('ph://')) return asset;
        try {
            const info = await MediaLibrary.getAssetInfoAsync(asset);
            return { ...asset, uri: info?.localUri ?? info?.uri ?? asset.uri };
        } catch (e) {
            console.warn("localUri 변환 실패:");
            return asset;
        }
    };

    const handleNext = async () => {
        if (selected.length === 0) return;
        const resolved = await Promise.all(
            selected.map(async (asset) => {
                const local = await resolveLocalUri(asset);
                // 영상은 썸네일을 미리 생성해 다음 단계에서 표시
                if (isVideoAsset(local)) {
                    try {
                        const { uri: thumbUri } = await VideoThumbnails.getThumbnailAsync(local.uri, { time: 1000 });
                        return { ...local, thumbUri };
                    } catch (e) {
                        console.warn("영상 썸네일 생성 실패:");
                    }
                }
                return local;
            })
        );
        onNext(resolved);
    };

    const renderItem = ({ item }) => {
        const selIdx = selected.findIndex(a => a.id === item.id);
        const isSelected = selIdx !== -1;

        return (
            <TouchableOpacity
                onPress={() => handleTap(item)}
                activeOpacity={0.85}
                style={{ width: ITEM_SIZE, height: ITEM_SIZE, padding: 0.5 }}
            >
                <Image
                    source={{ uri: item.uri }}
                    style={{ width: '100%', height: '100%', backgroundColor: '#e0e0e0' }}
                />

                {/* 선택 인디케이터 (View만 — 터치 충돌 없음) */}
                {isMultiSelect && (
                    <View style={{
                        position: 'absolute', top: 5, right: 6,
                        width: 22, height: 22, borderRadius: 11,
                        backgroundColor: isSelected ? '#fff' : 'rgba(200,200,200,0.55)',
                        justifyContent: 'center', alignItems: 'center',
                    }}>
                        {isSelected && (
                            <Text style={{ fontSize: 12, fontWeight: '800', color: '#000' }}>
                                {selIdx + 1}
                            </Text>
                        )}
                    </View>
                )}

                {/* 선택된 항목 어둡게 */}
                {isSelected && (
                    <View style={{
                        position: 'absolute', top: 0, left: 0,
                        width: '100%', height: '100%',
                        backgroundColor: 'rgba(180,180,180,0.3)',
                    }} />
                )}

                {item.mediaType === 'video' && (
                    <View style={{ position: 'absolute', bottom: 4, left: 4 }}>
                        <Ionicons name="play" size={10} color="#fff" />
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
            {/* 상단 바 */}
            <View style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                paddingHorizontal: 16, paddingVertical: 12,
            }}>
                <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="close" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={{ fontSize: 17, fontWeight: '600', color: '#000' }}>새 게시물</Text>
                <TouchableOpacity
                    onPress={handleNext}
                    disabled={selected.length === 0}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Text style={{ fontSize: 16, fontWeight: '600', color: selected.length > 0 ? '#6178FD' : '#ccc' }}>
                        다음
                    </Text>
                </TouchableOpacity>
            </View>

            {/* 미리보기 (정사각형) */}
            <View style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH, backgroundColor: '#000' }}>
                {preview ? (
                    isVideoAsset(preview) && previewVideoUri ? (
                        <VideoView
                            player={videoPlayer}
                            style={{ width: '100%', height: '100%' }}
                            contentFit="contain"
                            nativeControls
                            allowsPictureInPicture={false}
                        />
                    ) : (
                        <Image
                            source={{ uri: preview.uri }}
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="cover"
                        />
                    )
                ) : (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' }}>
                        <Ionicons name="image-outline" size={48} color="#D1D5DB" />
                    </View>
                )}
            </View>

            {/* 갤러리 헤더 */}
            <View style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                paddingHorizontal: 14, paddingVertical: 10,
            }}>
                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: '#000' }}>최근 항목</Text>
                    <Ionicons name="chevron-forward" size={16} color="#000" />
                </TouchableOpacity>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                    {/* 다중선택 토글 */}
                    <TouchableOpacity
                        onPress={toggleMultiSelect}
                        style={{
                            width: 34, height: 34, borderRadius: 17,
                            backgroundColor: isMultiSelect ? '#333A44' : '#F0F0F0',
                            justifyContent: 'center', alignItems: 'center',
                        }}
                    >
                        <Ionicons name="copy-outline" size={18} color={isMultiSelect ? '#fff' : '#333'} />
                    </TouchableOpacity>
                    {/* 카메라 */}
                    <TouchableOpacity
                        onPress={handleCameraPress}
                        style={{
                            width: 34, height: 34, borderRadius: 17,
                            backgroundColor: '#F0F0F0',
                            justifyContent: 'center', alignItems: 'center',
                        }}
                    >
                        <Ionicons name="camera-outline" size={18} color="#333" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* 사진 그리드 */}
            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator color="#6178FD" />
                </View>
            ) : (
                <FlatList
                    data={assets}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    numColumns={COLS}
                    onEndReached={() => hasNextPage && loadAssets(endCursor)}
                    onEndReachedThreshold={0.5}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 20 }}
                />
            )}
        </SafeAreaView>
    );
}
