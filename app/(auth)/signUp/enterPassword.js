import React, { useState } from "react";
import { View, Text } from "react-native";
import { StatusBar } from "expo-status-bar";
import { colors } from "@src/theme/colors";
import { useLocalSearchParams, useRouter } from "expo-router";
import Button from "@src/components/common/Button";
import SigningTextInput from "@src/components/common/SigningTextInput";
import {
  Pressable,
} from "@gluestack-ui/themed";
import { useSignUpStriderMutation } from "@src/hooks/mutations/useLoginMutation";
import { useAgreementStore } from "@src/store/useAgreementStore";

export default function EnterPassword() {
  const router = useRouter();
  const { id, phoneNumber } = useLocalSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState('');
  const { marketing, push, email, sms } = useAgreementStore(
    (state) => state.agreements
  );

  const isValidPassword = (pw) => {
    const regex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]).{8,}$/;
    return regex.test(pw);
  };

  const passwordValid = isValidPassword(password);
  const passwordsMatch = password === confirmPassword;
  const canSubmit = passwordValid && passwordsMatch

  const signUpStriderMutation = useSignUpStriderMutation()

  const signUpStrider = () => {
    if (!canSubmit) {
      alert("비밀번호가 유효하지 않거나 일치하지 않습니다.");
      return;
    }

    signUpStriderMutation.mutate(
      { id, 
        password, 
        phoneNumber, 
        marketing, 
        marketing_push: push,
        marketing_email: email, 
        marketing_sms: sms },
      {
        onSuccess: () => {
          console.log("가입 성공");
          alert("가입이 완료되었습니다.");
          router.push('(auth)/signUp/startStrider');
        },
        onError: (error) => {
          console.log("가입 실패:");
          alert("가입에 실패했습니다.");
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
        비밀번호를 입력해주세요.
      </Text>

      {/* 아이디/패스워드 입력 */}
      <View>
        <SigningTextInput
          className="mb-3"
          placeholder="비밀번호"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <SigningTextInput
          className="mb-3"
          placeholder="비밀번호 확인"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        <Text style={{ color: colors['dark-gray'] }} className="text-sm mr-1">영문, 숫자, 특수문자 조합 8자리 이상</Text>
      </View>

      {/* 가입 버튼 */}
      <Button
        text="가입하기"
        onPress={signUpStrider}
        variant="primary"
        size="large"
        className="mt-6"
        disabled={!canSubmit}
      />

    </View>
  );
}
