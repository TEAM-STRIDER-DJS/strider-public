import React, { useState } from "react";
import { View, Text } from "react-native";
import { StatusBar } from "expo-status-bar";
import { colors } from "@src/theme/colors";
import { useLocalSearchParams, useRouter } from "expo-router";
import Button from "@src/components/common/Button";
import SigningTextInput from "@src/components/common/SigningTextInput";
import { useCheckAvailableIdQuery } from "@src/hooks/queries/useAuthQuery";
import {
  Pressable,
  HStack
} from "@gluestack-ui/themed";

export default function EnterId() {
  const router = useRouter();
  const phoneNumber = useLocalSearchParams().phoneNumber;
  const [id, setId] = useState("");
  const [isValidId, setIsValidId] = useState(false);

  const checkAvailableIdQuery = useCheckAvailableIdQuery(id);

  const validateId = (input) => {
    const regex = /^[A-Za-z0-9]{6,}$/;
    return regex.test(input);
  };

  const handleIdChange = (input) => {
    setId(input);
    setIsValidId(validateId(input));
  };

  const checkAvailableId = () => {
    if (!isValidId) {
      alert("유효한 아이디를 입력해주세요.");
      return;
    }

    // trigger the disabled query; we already include id in the queryKey in the hook
    checkAvailableIdQuery
      .refetch()
      .then((result) => {
        // react-query returns an object with isSuccess/isError and either data or error
        if (result.isSuccess) {
          console.log("아이디 사용 가능");
          router.push({
            pathname: '(auth)/signUp/enterPassword',
            params: { id, phoneNumber },
          });
        } else if (result.error?.response?.status === 400) {
          alert("이미 사용 중인 아이디입니다.");
          console.log("아이디 중복:");
        } else {
          alert("서버 에러 입니다.");
          console.error("서버 에러:");
        }
      })
      .catch((err) => {
        console.error("refetch failed:");
        alert('서버 에러 입니다.');
      });
  };

  return (
    <View className="flex-1 bg-white px-4 pt-12 pb-8">
      <StatusBar style="dark" />

      <HStack position="absolute" space="sm" alignItems="center">
        {/* 뒤로가기 */}
        <Pressable flex={1} top="$12" left="$4" onPress={router.back}>
            <Text fontSize="$2xl">←</Text>
        </Pressable>
      </HStack>

      {/* 제목 */}
      <Text className="text-2xl font-bold text-center mt-16 mb-10">
        아이디를 입력해주세요.
      </Text>

      {/* 아이디/패스워드 입력 */}
      <View>
        <SigningTextInput
          className="mb-3"
          placeholder="아이디"
          value={id}
          onChangeText={handleIdChange}
        />
        <Text style={{ color: colors['dark-gray'] }} className="text-sm mr-1">영문 소문자, 숫자 조합 6자리 이상</Text>
      </View>

      {/* 다음 버튼 */}
      <Button
        text="다음"
        onPress={checkAvailableId}
        variant="primary"
        size="large"
        className="mt-6"
        disabled={!isValidId}
      />

    </View>
  );
}
