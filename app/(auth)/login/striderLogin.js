import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { colors } from "@src/theme/colors";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import Button from "@src/components/common/Button";
import SigningTextInput from "@src/components/common/SigningTextInput";
import { useLoginMutation } from "@src/hooks/mutations/useLoginMutation";
import SignUpBottomSheet from "../signUp/signUpBottomSheet";
import {
  Pressable,
} from "@gluestack-ui/themed";

export default function StriderLogin() {
  const router = useRouter();
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [isBottomSheetVisible, setBottomSheetVisible] = useState(false);

  // 로그인 mutation 훅
  const loginMutation = useLoginMutation();

  const handleLogin = () => {
    if (!id || !password) return;
    console.log("로그인 시도:");

    loginMutation.mutate(
      { id, password },
      {
        onSuccess: () => {
          console.log("로그인 성공");
          router.replace("(tabs)/home");
        },
        onError: (err) => {
          console.log("로그인 실패:");
        },
      }
    );
  };

  return (
    <View className="flex-1 bg-white px-4 pt-12 pb-8">
      <StatusBar style="dark" />

      {/* 뒤로가기 */}
      <Pressable position="absolute" top="$12" left="$4" onPress={router.back}>
          <Text fontSize="$5xl">←</Text>
      </Pressable>

      {/* 제목 */}
      <Text className="text-2xl font-bold text-center mt-16 mb-10">
        STRIDER ID 로그인
      </Text>

      {/* 아이디/패스워드 입력 */}
      <View>
        <SigningTextInput
          className="mb-3"
          placeholder="아이디"
          value={id}
          onChangeText={setId}
        />

        <SigningTextInput
          placeholder="비밀번호"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>

      {/* 로그인 버튼 */}
      <Button
        text="로그인하기"
        onPress={handleLogin}
        variant="primary"
        size="large"
        className="mt-6"
      />

      {/* 아이디/비밀번호 찾기, 회원가입 */}
      <View className="flex-row justify-center mt-7">
          <TouchableOpacity 
            onPress={() => router.push({ pathname: "(auth)/findMyId/findMyId"})}>
            <Text style={{ color: colors['dark-gray'] }} className="text-sm mr-1">아이디 찾기</Text>
          </TouchableOpacity>

          <Text style={{ color: colors['dark-gray'] }} className="text-gray-500 mr-1">|</Text>

          <TouchableOpacity onPress={() => router.push({ pathname: "(auth)/findMyPassword/findMyPassword"})}>
            <Text style={{ color: colors['dark-gray'] }} className="text-sm mr-1">비밀번호 찾기</Text>
          </TouchableOpacity>

          <Text style={{ color: colors['dark-gray'] }} className="text-gray-500 mr-1">|</Text>

          <TouchableOpacity onPress={() => setBottomSheetVisible(true)}>
            <Text style={{ color: colors['dark-gray'] }} className="text-sm mr-1">회원가입</Text>
          </TouchableOpacity>
      </View>

      {/* 회원가입 약관 동의 모달 */}
      <SignUpBottomSheet
            isVisible={isBottomSheetVisible}
            onClose={() => setBottomSheetVisible(false)}/>

    </View>
  );
}
