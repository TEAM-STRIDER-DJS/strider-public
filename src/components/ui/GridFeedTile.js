import React from 'react';
import { View, Image, Pressable, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const spacing = 1;
const numColumns = 3;
// 타일마다 marginRight(spacing)가 붙으므로 여백 3개를 반영해야 한 줄에 정확히 3개가 들어감
const boardWidth = Math.floor((width - spacing * numColumns) / numColumns);

// 로컬 에셋 매퍼 (경로 조정 완료)
const DUMMY_ASSET_MAP = {
    'onboard-1': require('../../../assets/strider-logo.png'),
    'onboard-2': require('../../../assets/strider-logo.png'),
    'onboard-3': require('../../../assets/strider-logo.png'),
    'strider-logo': require('../../../assets/strider-logo.png'),
};

const getImageSource = (fileUrl) => {
    if (fileUrl && DUMMY_ASSET_MAP[fileUrl]) return DUMMY_ASSET_MAP[fileUrl];
    if (fileUrl && (fileUrl.startsWith('http') || fileUrl.startsWith('data:'))) return { uri: fileUrl };
    return DUMMY_ASSET_MAP['onboard-1'];
};

const GridFeedTile = ({ item, onPressPost, selectable = false, selected = false, onToggleSelect }) => {
    const media = item?.mediaList?.[0];
    const isVideo = media?.mediaType === "VIDEO" || media?.fileUrl?.includes('video');
    const fileUrl = media?.fileUrl;
    const thumbnailUrl = media?.thumbnailUrl;

    // 영상은 재생하지 않고 썸네일(thumbnailUrl) 정적 표시 → 시스템 오버레이 없음
    const source = isVideo
        ? getImageSource(thumbnailUrl || fileUrl)
        : getImageSource(fileUrl);

    const tileStyle = {
        width: boardWidth,
        height: boardWidth, // 무조건 정방형(1칸)으로 통일
    };

    // 선택 모드에서는 탭이 상세 이동 대신 선택 토글로 동작
    const handlePress = () => {
        if (selectable) {
            onToggleSelect && onToggleSelect(item.feedPostId);
            return;
        }
        onPressPost && onPressPost(item.feedPostId);
    };

    return (
        <Pressable onPress={handlePress}>
            <View style={[tileStyle, { marginBottom: spacing, marginRight: spacing }]}>
                <View className="flex-1 bg-black">
                    <Image
                        source={source}
                        style={{ width: "100%", height: "100%" }}
                        resizeMode="cover"
                    />
                    {selectable && selected && (
                        <View className="absolute inset-0 bg-black/40" />
                    )}
                    <Ionicons
                        name={isVideo ? "videocam" : "image"}
                        size={isVideo ? 16 : 14}
                        color="white"
                        style={{ position: "absolute", top: 4, right: 4 }}
                    />
                    {selectable && (
                        <View
                            className={`w-5 h-5 rounded-full border items-center justify-center ${
                                selected ? "bg-main-blue-1 border-main-blue-1" : "border-white bg-black/20"
                            }`}
                            style={{ position: "absolute", top: 4, left: 4 }}
                        >
                            {selected && <Ionicons name="checkmark" size={14} color="white" />}
                        </View>
                    )}
                </View>
            </View>
        </Pressable>
    );
};

export default GridFeedTile;
