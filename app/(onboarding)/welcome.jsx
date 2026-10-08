import React, { useRef, useState } from "react";
import { View, Text, ScrollView, Image, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import Button from "@src/components/common/Button";
import { mmkv } from "@src/lib/mmkv";

const { width } = Dimensions.get("window");

const IMAGE_WIDTH = Math.round(width * 0.72);
const IMAGE_HEIGHT = Math.round((IMAGE_WIDTH * 4) / 3);

const images = [
  require("../../assets/strider-logo.png"),
  require("../../assets/strider-logo.png"),
  require("../../assets/strider-logo.png"),
];

export default function Welcome() {
  const router = useRouter();
  const scrollRef = useRef(null);
  const [index, setIndex] = useState(0);

  const handleScroll = (e) => {
    const { contentOffset, layoutMeasurement } = e.nativeEvent;
    const pageIndex = Math.round(contentOffset.x / layoutMeasurement.width);
    setIndex(pageIndex);
  };

  const handleContinue = () => {
    mmkv.set("hasSeenWelcome", "true");
    router.replace("(auth)/login/login");
  };

  return (
    <View className="flex-1 bg-white pt-16">
     
      {/* 제목 */}
      <View className="px-6">
        <Text className="text-2xl font-bold text-center mt-16">
          스트라이더에서 즐기는
        </Text>
        <Text className="text-2xl font-bold text-center mt-1 mb-8">
          여러가지 스포츠
        </Text>
      </View>

      {/* 이미지 스와이프 */}
      <View style={{ height: IMAGE_HEIGHT + 40 }}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {images.map((src, i) => (
            <View
              key={i}
              style={{
                width,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Image
                source={src}
                style={{
                  width: IMAGE_WIDTH,
                  height: IMAGE_HEIGHT,
                  borderRadius: 16,
                }}
                resizeMode="cover"
              />
            </View>
          ))}
        </ScrollView>
      </View>

      {/* 페이지 인디케이터 */}
      <View className="flex-row justify-center items-center mt-4">
        {images.map((_, i) => (
          <View
            key={i}
            style={{
              width: i === index ? 16 : 8,
              height: 8,
              borderRadius: 4,
              marginHorizontal: 4,
              backgroundColor: i === index ? "#111" : "#D1D5DB",
            }}
          />
        ))}
      </View>

      {/* 하단 설명 */}
      <View className="px-6 mt-6">
        <Text className="text-center text-gray-600 leading-6">
          집앞 러닝 오픈런부터{"\n"}
          체크해주는 모임, SNS, 커뮤니티까지
        </Text>
      </View>

      {/* 하단 버튼 */}
      <View className="px-6 mt-auto pb-16">
        <Button
          text="스트라이드 로그인"
          onPress={handleContinue}
          variant="primary"
          size="large"
        />
      </View>
    </View>
  );
}