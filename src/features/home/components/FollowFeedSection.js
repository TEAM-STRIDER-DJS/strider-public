import React, { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Image, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/ko";

dayjs.extend(relativeTime);
dayjs.locale("ko");

const INITIAL_COLORS = [
    "#3CD281", "#6178FD", "#FF716C", "#FFBA21",
    "#FF9500", "#8B5CF6", "#06B6D4", "#F43F5E",
];

function getInitialColor(nickname) {
    if (!nickname) return INITIAL_COLORS[0];
    const code = [...nickname].reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return INITIAL_COLORS[code % INITIAL_COLORS.length];
}

// 스켈레톤 shimmer
function Shimmer({ style }) {
    const anim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: true }),
                Animated.timing(anim, { toValue: 0, duration: 900, useNativeDriver: true }),
            ])
        ).start();
    }, []);
    const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });
    return <Animated.View style={[{ backgroundColor: "#E5E7EB", borderRadius: 8 }, style, { opacity }]} />;
}

function FeedMiniCard({ item, onPress }) {
    const profileImg = item.userProfileImg;
    const nickname = item.userNickname ?? "?";
    const initial = nickname[0];
    const bgColor = getInitialColor(nickname);
    const timeAgo = item.createdAt ? dayjs(item.createdAt).fromNow() : "";
    const steps = item.stepsToday ?? item.stepCount;

    return (
        <TouchableOpacity
            className="bg-white rounded-2xl p-4 mb-2 shadow-sm flex-row items-center"
            onPress={onPress}
            activeOpacity={0.8}
        >
            {/* 프로필 이미지/이니셜 */}
            <View className="w-10 h-10 rounded-xl overflow-hidden mr-3">
                <Image
                    source={profileImg ? { uri: profileImg } : require('@assets/strider-logo.png')}
                    className="w-full h-full"
                    resizeMode="cover"
                />
            </View>

            {/* 텍스트 */}
            <View className="flex-1">
                <View className="flex-row items-center gap-1 mb-0.5">
                    <Text className="text-sm font-bold text-[#333A44]">{nickname}</Text>
                    <Text className="text-xs text-[#9FA4B0]">{timeAgo}</Text>
                </View>
                <Text className="text-xs text-[#666F7C]" numberOfLines={1}>
                    {item.review}
                </Text>
            </View>

            {/* 걸음 수 */}
            {steps != null && (
                <View className="bg-[#F3F4F6] rounded-full px-2.5 py-1 ml-2">
                    <Text className="text-xs font-semibold text-[#333A44]">
                        {Number(steps).toLocaleString()}걸음
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );
}

export default function FollowFeedSection({ data, isLoading }) {
    const router = useRouter();

    if (isLoading) {
        return (
            <View className="px-4 mb-3">
                <Shimmer style={{ height: 20, width: 90, marginBottom: 12 }} />
                {[1, 2, 3].map((i) => (
                    <View key={i} className="bg-white rounded-2xl p-4 mb-2 flex-row items-center">
                        <Shimmer style={{ width: 40, height: 40, borderRadius: 10, marginRight: 12 }} />
                        <View className="flex-1 gap-2">
                            <Shimmer style={{ height: 12, width: "50%" }} />
                            <Shimmer style={{ height: 10, width: "75%" }} />
                        </View>
                    </View>
                ))}
            </View>
        );
    }

    const posts = data?.slice(0, 3) ?? [];
    if (!posts.length) return null;

    return (
        <View className="px-4 mb-3">
            {/* 섹션 헤더 */}
            <View className="flex-row items-center justify-between mb-3">
                <Text className="text-base font-bold text-[#333A44]">팔로우 피드</Text>
                <TouchableOpacity
                    onPress={() => router.push({ pathname: "/(tabs)/feed", params: { tab: 'home' } })}
                    className="flex-row items-center"
                >
                    <Text className="text-sm text-[#3CD281] font-semibold">더보기</Text>
                    <Ionicons name="arrow-forward" size={14} color="#3CD281" style={{ marginLeft: 2 }} />
                </TouchableOpacity>
            </View>

            {posts.map((item) => (
                <FeedMiniCard
                    key={item.feedPostId}
                    item={item}
                    onPress={() => router.push(`/feed/${item.feedPostId}`)}
                />
            ))}
        </View>
    );
}
