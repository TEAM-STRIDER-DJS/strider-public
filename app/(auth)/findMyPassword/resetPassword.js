import React, { useState } from "react";
import { View, Text } from "react-native";
import { StatusBar } from "expo-status-bar";
import { colors } from "@src/theme/colors";
import { useRouter, useLocalSearchParams } from "expo-router";
import Button from "@src/components/common/Button";
import SigningTextInput from "@src/components/common/SigningTextInput";
import {
  Pressable,
} from "@gluestack-ui/themed";
import { useResetPasswordMutation } from "@src/hooks/mutations/useLoginMutation";

export default function ResetPassword() {
  const router = useRouter();
  const {phoneNumber} = useLocalSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

    const isValidPassword = (pw) => {
      const regex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]).{8,}$/;
      return regex.test(pw);
    };
  
    const passwordValid = isValidPassword(password);
    const passwordsMatch = password === confirmPassword;
    const canSubmit = passwordValid && passwordsMatch

    const resetPasswordMutation = useResetPasswordMutation();

    const resetPassword = () => {
      if (!canSubmit) {
        alert("비밀번호가 유효하지 않거나 일치하지 않습니다.");
        return;
      }
  
      resetPasswordMutation.mutate(
        { password, 
          phoneNumber,
        },
        {
          onSuccess: () => {
            console.log("패스워드 변경 성공");
            alert("패스워드가 변경되었습니다.");
            router.replace('(auth)/login/striderLogin');
          },
          onError: (error) => {
            console.log("패스워드 변경 실패:");
            alert("패스워드 변경에 실패했습니다.");
          },
        }
      );
    };

  return (
    <View className="flex-1 bg-white px-4 pt-12 pb-8">
      <StatusBar style="dark"/>

      {/* 뒤로가기 */}
      <Pressable position="absolute" top="$12" left="$4" onPress={router.back}>
          <Text fontSize="$5xl">←</Text>
      </Pressable>

      {/* 제목 */}
      <Text className="text-2xl font-bold text-center mt-16 mb-10">
        비밀번호를 재설정
      </Text>

      {/* 패스워드 입력 */}
      <View>
        <SigningTextInput
          className="mb-3"
          placeholder="비밀번호"
          value={password}
          onChangeText={setPassword}
        />

        <SigningTextInput
          className="mb-3"
          placeholder="비밀번호 확인"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        <Text style={{ color: colors['dark-gray'] }} className="text-sm mr-1">영문, 숫자, 특수문자 조합 8자리 이상</Text>
      </View>

      {/* 재설정 버튼 */}
      <Button
        text="비밀번호 재설정하기"
        onPress={resetPassword}
        variant="primary"
        size="large"
        className="mt-6"
      />

    </View>
  );
}
