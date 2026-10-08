import React, { useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  Box,
  Text,
  Pressable,
  VStack,
  HStack,
} from "@gluestack-ui/themed";
import Button from "@src/components/common/Button";
import SigningTextInput from "@src/components/common/SigningTextInput";
import { useSendPhoneCodeMutation } from "@src/hooks/mutations/useLoginMutation";
import { useVerifyPhoneCodeQuery } from "@src/hooks/queries/useAuthQuery";
import { usePhoneNumberStore } from "@src/store/authStore";

export default function PhoneAuthentication() {
    const router = useRouter();
    const { phoneNumber, setPhoneNumber } = usePhoneNumberStore();
    const [code, setCode] = useState("");
    const [verifyEnabled, setVerifyEnabled] = useState(false);

    const sendCodeMutation = useSendPhoneCodeMutation();

    const verifyQuery = useVerifyPhoneCodeQuery(
        phoneNumber,
        code,
        verifyEnabled
    );

    const isValidPhoneNumber = /^010\d{8}$/.test(phoneNumber);
    const isValidCode = /^\d{6}$/.test(code);

    /** 인증번호 전송 */
    const handleSendCode = () => {
        if (!phoneNumber) {
            Alert.alert("안내", "휴대폰 번호를 입력해주세요.");
            return;
        }

        sendCodeMutation.mutate(phoneNumber, {
            onSuccess: (res) => {
                Alert.alert("안내", res.data?.message || "인증번호를 전송했어요.");
            },
            onError: () => {
                Alert.alert("오류", "인증번호 전송에 실패했어요.");
            },
        });
    };

    /** 인증번호 확인 */
    const handleVerifyCode = async () => {
        if (!code) {
            Alert.alert("안내", "인증번호를 입력해주세요.");
            return;
        }

        try {
            setVerifyEnabled(true);
            console.log("인증번호 확인 중...");
            const res = await verifyQuery.refetch();
            console.log("인증번호 확인 결과:");

            // React Query refetch result has shape like { status, data, error, isSuccess, isError }
            if (res.status === "success" || res.isSuccess) {
                router.push({
                    pathname: "(auth)/signUp/enterId",
                    params: {
                        phoneNumber,
                    },
                });
            } else if (res.error?.response?.status === 400) {
                Alert.alert("실패", "인증번호가 일치하지 않아요.");
            } else if (res.isError || res.status === 'error') {
                const err = res.error;
                console.error("[verify] refetch result error object:");

                const serverMessage = err?.response?.data?.message || err?.message || '인증번호 확인에 실패했습니다.';
                if (err?.response) {
                    console.error("[verify] server response:");
                } else if (err?.request) {
                    console.error("[verify] no response received, request:");
                }
                Alert.alert("실패", serverMessage);
            } else {
                Alert.alert("실패", "인증에 실패했습니다.");
            }
        } catch (err) {
            console.error("[verify] unexpected error:");
            Alert.alert("실패", "서버 에러");
        } finally {
            setVerifyEnabled(false);
        }
    };

    return (
        <Box flex={1} bg="$white" px="$4" pt="$12">
            <StatusBar style="dark" />

            <HStack position="absolute" space="sm" alignItems="center">
                {/* 뒤로가기 */}
                <Pressable flex={1} top="$12" left="$4" onPress={router.back}>
                    <Text fontSize="$2xl">←</Text>
                </Pressable>
            </HStack>
            

            <VStack mt="$10">
                {/* 제목 */}
                <Text
                    fontSize="$2xl"
                    fontWeight="$bold"
                    textAlign="center"
                    mb="$8"
                >
                    본인 확인을 위해{"\n"}휴대폰 번호를 입력해주세요
                </Text>
            </VStack>

            <VStack space="md">
                <HStack space="sm" alignItems="center">
                    <Box flex={1}>
                        <SigningTextInput
                            placeholder="휴대폰 번호"
                            keyboardType="number-pad"
                            value={phoneNumber}
                            onChangeText={(text) => {
                                const onlyNumber = text.replace(/[^0-9]/g, "");
                                setPhoneNumber(onlyNumber);
                            }}
                        />
                    </Box>

                    <Box width={110}>
                        <Button
                            text="인증번호 전송"
                            size="large"
                            onPress={handleSendCode}
                            disabled={!isValidPhoneNumber}
                            loading={sendCodeMutation.isPending}
                        />
                    </Box>
                </HStack>

                {/* 인증번호 */}
                <SigningTextInput
                    placeholder="인증번호 6자리"
                    keyboardType="number-pad"
                    value={code}
                    onChangeText={(text) => {
                        const onlyNumber = text.replace(/[^0-9]/g, "").slice(0, 6);
                        setCode(onlyNumber);
                    }}
                />

                {/* 인증하기 */}
                <Button
                    text="인증하기"
                    size="large"
                    variant="primary"
                    onPress={handleVerifyCode}
                    loading={verifyQuery.isFetching}
                    disabled={!/^\d{6}$/.test(code)}
                />
            </VStack>
        </Box>
  );
}