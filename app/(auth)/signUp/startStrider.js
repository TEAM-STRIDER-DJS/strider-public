import React from 'react';
import { View, Text, Image } from 'react-native';
import Button from "@src/components/common/Button";
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function StartStrider() {
    const router = useRouter();

    return(
        <View className="bg-white px-6 pt-60">
            <StatusBar style="dark" />

            <View className='gap-[40px]'>
                {/* 타이틀 */}
                <View className="mt-12 mb-6">
                    <Text className="text-2xl font-bold text-center">환영합니다!</Text>
                </View>

                {/* 로고 */}
                <View className="self-center w-40 h-40 rounded-full overflow-hidden">
                    <Image
                    source={require('../../../assets/strider-logo.png')}
                    style={{ width: '100%', height: '100%' }}
                    />
                </View>

                <Button
                    text="스트라이더 시작하기"
                    size="large"
                    onPress={() => router.push('(tabs)/home')}
                />
            </View>
        </View>
    );
}
