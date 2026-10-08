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
import { findMyIdQuery } from "@src/hooks/queries/useAuthQuery";
import { colors } from "@src/theme/colors";

export default function FindMyId() {
    const router = useRouter(); 
    const [phoneNumber, setPhoneNumber] = useState("");
    const [code, setCode] = useState("");
    const [verifyEnabled, setVerifyEnabled] = useState(false);

    const sendCodeMutation = useSendPhoneCodeMutation();

    const verifyQuery = findMyIdQuery(
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

            // react-query refetch() returns an object like { status, isSuccess, data, error }
            if (res.isSuccess || res.status === 'success') {
                // The queryFn returns the axios response, whose .data is the server body.
                // Server body in this API looks like: { data: { data: { provider, maskedProviderId }, meta: { ... } } }
                const serverBody = res.data; // axios response
                const payload = serverBody?.data?.data;
                const provider = payload?.provider;
                const maskedProviderId = payload?.maskedProviderId;

                router.push({
                    pathname: "(auth)/findMyId/resultOfFindMyId",
                    params: {
                        provider,
                        maskedProviderId,
                    },
                });
            } else {
                const err = res.error;
                console.error("[verify] refetch result error object:");

                const serverMessage = err?.response?.data?.message || err?.message || '인증번호 확인에 실패했습니다.';
                if (err?.response) {
                    console.error("[verify] server response:");
                } else if (err?.request) {
                    console.error("[verify] no response received, request:");
                }

                Alert.alert('실패', serverMessage);
            }
        } catch {
            Alert.alert("실패", "인증번호가 일치하지 않아요.");
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
                    아이디 찾기
                </Text>

                {/* 제목 */}
                <Text
                    style={{ color: colors['dark-gray'] }}
                    fontSize="$s"
                    textAlign="center"
                    mb="$8"
                >
                    전화번호 인증으로 아이디 찾기가 가능합니다.
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