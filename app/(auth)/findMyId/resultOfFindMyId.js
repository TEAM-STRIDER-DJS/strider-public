import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Button from "@src/components/common/Button";

export default function FindIdResultScreen() {
    const router = useRouter();
    const {provider, maskedProviderId} = useLocalSearchParams();

    return (
        <View className="flex-1 bg-white pt-16 px-6">
            <StatusBar style="dark" />

            {/* 상단 뒤로가기 */}
            <TouchableOpacity onPress={() => router.back()} className="absolute top-14 left-4">
                <Text className="text-3xl">←</Text>
            </TouchableOpacity>

            {/* 메시지 */}
            <Text className="text-xl font-bold text-center mt-28 mb-8">
                회원님의 아이디를 찾았어요.
            </Text>

            <View className='mb-3'>
                {!provider && (
                    <Text className="text-gray-600 text-base">연결된 계정이 없습니다.</Text>
                )}

                {provider && (() => {
                    const configs = {
                        NAVER: { label: '네이버', icon: 'S', iconBg: 'bg-green-500', iconTextClass: 'text-white font-bold text-lg' },
                        KAKAO: { label: '카카오', icon: 'K', iconBg: 'bg-yellow-400', iconTextClass: 'text-black font-bold text-lg' },
                        APPLE: { label: 'Apple', icon: '', iconBg: 'bg-black', iconTextClass: 'text-white font-bold text-xl' },
                        LOCAL: { label: 'Strider', icon: 'S', iconBg: 'bg-blue-500', iconTextClass: 'text-white font-bold text-lg' },
                    };

                    const cfg = configs[provider] || { label: provider, icon: '?', iconBg: 'bg-gray-400', iconTextClass: 'text-white font-bold text-lg' };

                    return (
                        <View className="bg-gray-100 rounded-md px-4 py-3 flex-row items-center mb-3">
                            <View className="flex-row items-center mr-6 pl-1">
                                <View className={`w-8 h-8 rounded-full ${cfg.iconBg} items-center justify-center mr-2`}>
                                    <Text className={`${cfg.iconTextClass}`}>{cfg.icon}</Text>
                                </View>
                                <Text className="text-gray-600 text-base">{cfg.label}</Text>
                            </View>
                            <Text className="text-base font-semibold text-black">{maskedProviderId}</Text>
                        </View>
                    );
                })()}
            </View>

            {/* 다음 버튼 */}
            <Button
                text="로그인하기"
                variant="primary"
                size="large"
                className="mt-6"
                onPress={() => router.push('(auth)/login/login')}
            />
        </View>
    );
}
