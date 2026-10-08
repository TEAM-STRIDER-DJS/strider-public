import React, { useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import Button from "@src/components/common/Button";
import TopBar from "@src/components/common/TopBar";
import { VStack, SafeAreaView } from "@gluestack-ui/themed";
import Feather from "@expo/vector-icons/Feather";
import { useUpdatePasswordMutation } from "@src/hooks/mutations/useUpdateProfileMutation";

const MainContent = () => {
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { mutate: updatePassword, isPending } = useUpdatePasswordMutation();

  const validatePassword = (password) => {
    const regex =
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    return regex.test(password);
  };

  const passwordError =
    newPassword.length > 0 && !validatePassword(newPassword)
      ? "영문, 숫자, 특수문자 조합 8자리 이상이어야 합니다."
      : "";

  const samePasswordError =
    currentPassword.length > 0 &&
    newPassword.length > 0 &&
    currentPassword === newPassword
      ? "현재 비밀번호와 다른 비밀번호를 입력해주세요."
      : "";

  const confirmPasswordError =
    confirmPassword.length > 0 && confirmPassword !== newPassword
      ? "새 비밀번호와 일치하지 않습니다."
      : "";

  const isFormValid =
    currentPassword.length > 0 &&
    newPassword.length > 0 &&
    confirmPassword.length > 0 &&
    passwordError === "" &&
    samePasswordError === "" &&
    confirmPasswordError === "" &&
    newPassword === confirmPassword;

  const handleSubmit = () => {
    if (!isFormValid) return;

    console.log("Submitting password change:");

    updatePassword(
      { currentPassword, newPassword },
      {
        onSuccess: () => router.back(),
      },
    );
  };

  return (
    <ScrollView className="flex-1 px-5 py-4">
      <VStack>
        {/* 현재 비밀번호 */}
        <View className="mb-6 relative">
          <Text className="text-black font-medium mb-2">현재 비밀번호</Text>
          <View className="bg-gray-100 rounded-md px-4 py-3 border border-gray-300">
            <TextInput
              className="text-black"
              secureTextEntry={!showCurrentPassword}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="현재 비밀번호를 입력하세요"
              autoCorrect={false}
              spellCheck={false}
            />
          </View>
          <Pressable
            onPress={() => setShowCurrentPassword((prev) => !prev)}
            className="absolute right-4 top-10"
          >
            <Feather name="eye" size={20} color="gray" />
          </Pressable>
        </View>

        {/* 새 비밀번호 */}
        <View className="mb-6 relative">
          <Text className="text-black font-medium mb-2">새 비밀번호</Text>
          <View className="bg-gray-100 rounded-md px-4 py-3 border border-gray-300">
            <TextInput
              className="text-black"
              secureTextEntry={!showNewPassword}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="새 비밀번호를 입력하세요"
              autoCorrect={false}
              spellCheck={false}
            />
          </View>
          <Pressable
            onPress={() => setShowNewPassword((prev) => !prev)}
            className="absolute right-4 top-10"
          >
            <Feather name="eye" size={20} color="gray" />
          </Pressable>
          {passwordError && (
            <Text className="text-red-500 mt-1 text-sm">{passwordError}</Text>
          )}
          {samePasswordError && (
            <Text className="text-red-500 mt-1 text-sm">
              {samePasswordError}
            </Text>
          )}
        </View>

        {/* 새 비밀번호 확인 */}
        <View className="mb-6 relative">
          <Text className="text-black font-medium mb-2">새 비밀번호 확인</Text>
          <View className="bg-gray-100 rounded-md px-4 py-3 border border-gray-300">
            <TextInput
              className="text-black"
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="새 비밀번호를 다시 입력하세요"
              autoCorrect={false}
              spellCheck={false}
            />
          </View>
          <Pressable
            onPress={() => setShowConfirmPassword((prev) => !prev)}
            className="absolute right-4 top-10"
          >
            <Feather name="eye" size={20} color="gray" />
          </Pressable>
          {confirmPasswordError && (
            <Text className="text-red-500 mt-1 text-sm">
              {confirmPasswordError}
            </Text>
          )}
        </View>

        <Button
          text="완료"
          onPress={handleSubmit}
          disabled={!isFormValid || isPending}
          variant="primary"
          size="large"
        />
      </VStack>
    </ScrollView>
  );
};

export default function EditProfileScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <VStack className="h-full w-full">
        <TopBar title="비밀번호 변경" />
        <MainContent />
      </VStack>
    </SafeAreaView>
  );
}
