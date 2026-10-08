import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// 더미 이미지 데이터
const DUMMY_IMAGES = [
    'onboard-1', 'onboard-2', 'onboard-3', 'strider-logo',
    'onboard-2', 'onboard-3', 'onboard-1', 'strider-logo',
    'onboard-3', 'onboard-1', 'onboard-2', 'strider-logo',
    'onboard-1', 'onboard-2', 'onboard-3', 'strider-logo',
    'onboard-2', 'onboard-3', 'onboard-1', 'strider-logo',
];

const DUMMY_ASSET_MAP = {
    'onboard-1': require('../../../../assets/strider-logo.png'),
    'onboard-2': require('../../../../assets/strider-logo.png'),
    'onboard-3': require('../../../../assets/strider-logo.png'),
    'strider-logo': require('../../../../assets/strider-logo.png'),
};

const getImageSource = (name) => DUMMY_ASSET_MAP[name];

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const ITEM_SIZE = width / COLUMN_COUNT;

export default function SearchScreen() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const inputRef = useRef(null);

    // 화면 진입 시 키보드 자동 포커스
    useEffect(() => {
        const timer = setTimeout(() => {
            inputRef.current?.focus();
        }, 300);
        return () => clearTimeout(timer);
    }, []);

    const renderItem = ({ item }) => (
        <TouchableOpacity
            onPress={() => console.log('Image Pressed')}
            style={{ width: ITEM_SIZE, height: ITEM_SIZE, padding: 1 }}
        >
            <Image
                source={getImageSource(item)}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
            />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
            {/* Header: Search Bar */}
            <View className="flex-row items-center px-4 py-2 border-b border-gray-100">
                <TouchableOpacity onPress={() => router.back()} className="mr-3">
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>

                <View className="flex-1 flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
                    <Ionicons name="search" size={18} color="#9CA3AF" />
                    <TextInput
                        ref={inputRef}
                        className="flex-1 ml-2 text-base text-gray-900 p-0"
                        placeholder="검색"
                        placeholderTextColor="#9CA3AF"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoCapitalize="none"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Content: Grid or Recent Searches */}
            <FlatList
                data={DUMMY_IMAGES}
                renderItem={renderItem}
                keyExtractor={(item, index) => index.toString()}
                numColumns={COLUMN_COUNT}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
                ListHeaderComponent={
                    searchQuery.length > 0 ? (
                        <View className="p-4">
                            <Text className="text-gray-500 mb-2">검색 결과</Text>
                            {/* 여기에 유저 검색 결과 등을 리스트로 보여줄 수 있음 */}
                        </View>
                    ) : null
                }
            />
        </SafeAreaView>
    );
}
