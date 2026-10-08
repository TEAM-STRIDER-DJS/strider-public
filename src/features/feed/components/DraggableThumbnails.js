import React, { useEffect } from 'react';
import { View, Image, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    useAnimatedReaction,
    withSpring,
    runOnJS,
} from 'react-native-reanimated';

const ITEM = 72;       // 썸네일 크기
const GAP = 10;        // 간격
const SLOT = ITEM + GAP;
const PAD_TOP = 8;     // 뱃지 overflow 여유
const PAD_SIDE = 16;

// 손 뗐을 때 제자리 안착 (기존 그대로)
const SPRING = { damping: 20, stiffness: 200 };
// 사이에 끼울 때 다른 사진들이 비켜주는 속도 — 느긋하게
const REORDER_SPRING = { damping: 26, stiffness: 90, mass: 1 };
// 자리 변경 기준점 (슬롯 중앙) — 끌어간 위치에 정확히 놓임
const THRESHOLD = 0.5;

// positions 객체에서 from→to 로 순서 이동 (worklet)
function objectMove(positions, from, to) {
    'worklet';
    const next = { ...positions };
    for (const id in positions) {
        if (positions[id] === from) next[id] = to;
        else if (from < to && positions[id] > from && positions[id] <= to) next[id] = positions[id] - 1;
        else if (from > to && positions[id] < from && positions[id] >= to) next[id] = positions[id] + 1;
    }
    return next;
}

const clamp = (v, min, max) => {
    'worklet';
    return Math.min(Math.max(v, min), max);
};

function Thumbnail({ item, index, positions, count, onRemove, activeId }) {
    const id = item.id;
    // 초기 위치는 index로 (positions 초기값 == media 인덱스). 렌더 중 .value 읽기 금지
    const translateX = useSharedValue(index * SLOT);
    const isDragging = useSharedValue(false);
    const startX = useSharedValue(0); // 드래그 시작 시점 기준점 (고정)

    // 다른 항목이 드래그되어 내 순서가 바뀌면 부드럽게 이동
    useAnimatedReaction(
        () => positions.value[id],
        (order, prev) => {
            if (order == null) return;
            if (!isDragging.value && order !== prev) {
                translateX.value = withSpring(order * SLOT, REORDER_SPRING);
            }
        }
    );

    const pan = Gesture.Pan()
        .activateAfterLongPress(220)
        .onStart(() => {
            isDragging.value = true;
            activeId.value = id;
            // 기준점을 시작 순서로 고정 (프레임마다 재계산 금지 → 팡 튕김 방지)
            startX.value = (positions.value[id] ?? 0) * SLOT;
        })
        .onUpdate((e) => {
            // 고정된 기준점 + 손가락 누적 이동량 → 손가락 실제 위치 반영
            translateX.value = startX.value + e.translationX;

            // 한 칸씩만, 슬롯 중앙(THRESHOLD)을 넘어가면 자리 변경
            const pos = translateX.value / SLOT;
            const curOrder = positions.value[id];
            let target = curOrder;
            if (pos > curOrder + THRESHOLD) target = curOrder + 1;
            else if (pos < curOrder - THRESHOLD) target = curOrder - 1;
            target = clamp(target, 0, count - 1);

            if (target !== curOrder) {
                positions.value = objectMove(positions.value, curOrder, target);
            }
        })
        .onEnd(() => {
            const finalOrder = positions.value[id];
            translateX.value = withSpring(finalOrder * SLOT, SPRING);
            isDragging.value = false;
            activeId.value = null;
            runOnJS(onRemove.commit)();
        });

    const animStyle = useAnimatedStyle(() => ({
        position: 'absolute',
        left: 0,
        transform: [{ translateX: translateX.value }, { scale: withSpring(isDragging.value ? 1.1 : 1) }],
        zIndex: isDragging.value ? 10 : 0,
        shadowColor: '#000',
        shadowOpacity: isDragging.value ? 0.25 : 0,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
    }));

    return (
        <GestureDetector gesture={pan}>
            <Animated.View style={[{ width: ITEM, height: ITEM, top: PAD_TOP }, animStyle]}>
                <Image
                    source={{ uri: item.thumbUri || item.uri }}
                    style={{ width: ITEM, height: ITEM, borderRadius: 10, backgroundColor: '#E5E7EB' }}
                />
                {/* 영상 표시 (재생 아이콘) */}
                {(item.mediaType === 'video' || item.mediaType === 'VIDEO') && (
                    <View style={{ position: 'absolute', top: 5, left: 5 }}>
                        <Ionicons name="play" size={13} color="#fff" />
                    </View>
                )}
                {/* 순서 번호 — 좌하단 작은 반투명 뱃지 */}
                <View style={{
                    position: 'absolute', bottom: 5, left: 5,
                    minWidth: 17, height: 17, paddingHorizontal: 4, borderRadius: 6,
                    backgroundColor: 'rgba(0,0,0,0.55)',
                    justifyContent: 'center', alignItems: 'center',
                }}>
                    <ThumbOrderText positions={positions} id={id} initialOrder={index} />
                </View>
                {/* 삭제 X */}
                <TouchableOpacity
                    onPress={() => onRemove.remove(id)}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    style={{
                        position: 'absolute', top: -6, right: -6,
                        width: 20, height: 20, borderRadius: 10,
                        backgroundColor: '#333A44', borderWidth: 1.5, borderColor: '#fff',
                        justifyContent: 'center', alignItems: 'center',
                    }}
                >
                    <Ionicons name="close" size={11} color="#fff" />
                </TouchableOpacity>
            </Animated.View>
        </GestureDetector>
    );
}

// 번호 텍스트도 positions에 반응해서 실시간 갱신
function ThumbOrderText({ positions, id, initialOrder }) {
    const [n, setN] = React.useState(initialOrder + 1);
    useAnimatedReaction(
        () => positions.value[id],
        (order) => {
            if (order != null) runOnJS(setN)(order + 1);
        }
    );
    return <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{n}</Text>;
}

export default function DraggableThumbnails({ media, onChange }) {
    const positions = useSharedValue(
        Object.fromEntries(media.map((m, i) => [m.id, i]))
    );
    const activeId = useSharedValue(null);

    // media 목록이 바뀌면 positions 동기화
    useEffect(() => {
        positions.value = Object.fromEntries(media.map((m, i) => [m.id, i]));
    }, [media.map(m => m.id).join(',')]);

    const commit = () => {
        const ordered = [...media].sort(
            (a, b) => (positions.value[a.id] ?? 0) - (positions.value[b.id] ?? 0)
        );
        // 순서가 실제로 바뀌었을 때만 반영
        const changed = ordered.some((m, i) => m.id !== media[i]?.id);
        if (changed) onChange(ordered);
    };

    const remove = (id) => {
        onChange(media.filter(m => m.id !== id));
    };

    const contentWidth = media.length * SLOT - GAP + PAD_SIDE * 2;

    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: PAD_SIDE }}
            style={{ height: ITEM + PAD_TOP * 2 + 8 }}
        >
            <View style={{ width: Math.max(contentWidth - PAD_SIDE * 2, 0), height: ITEM + PAD_TOP * 2 }}>
                {media.map((item, index) => (
                    <Thumbnail
                        key={item.id}
                        item={item}
                        index={index}
                        positions={positions}
                        count={media.length}
                        activeId={activeId}
                        onRemove={{ remove, commit }}
                    />
                ))}
            </View>
        </ScrollView>
    );
}
