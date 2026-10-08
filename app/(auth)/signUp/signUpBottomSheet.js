import React from "react";
import { View, Alert } from "react-native";
import { useRouter } from "expo-router";
import {
    Actionsheet,
    ActionsheetBackdrop,
    ActionsheetContent,
    ActionsheetDragIndicator,
    ActionsheetDragIndicatorWrapper,
    Box,
    Text,
    Pressable,
    ScrollView,
    VStack,
} from "@gluestack-ui/themed";
import { useAgreementStore } from "@src/store/useAgreementStore";
import Button from "@src/components/common/Button";
import { colors } from "@src/theme/colors";

export default function SignUpBottomSheet({ isVisible, onClose }) {
    const router = useRouter();

    const {
        agreements,
        toggle,
        reset,
        setAll,
        allRequiredChecked,
    } = useAgreementStore();

    const allChecked = Object.values(agreements).every(Boolean);

    const handleSignUp = () => {
        if (!allRequiredChecked()) {
        Alert.alert("안내", "필수 항목에 모두 동의해주세요.");
        return;
        }

        onClose?.();

        setTimeout(() => {
        reset();
        router.push({ pathname: "(auth)/signUp/phoneAuthentication" });
        }, 300);
    };

    return (
        <Actionsheet isOpen={isVisible} onClose={onClose}>
            <ActionsheetBackdrop />
            
            <ActionsheetContent px="$1" alignItems="left"> 
                <ActionsheetDragIndicatorWrapper>
                    <ActionsheetDragIndicator />
                </ActionsheetDragIndicatorWrapper>

                <View className="mx-7 my-6">
                {/* Header */}
                <Box flexDirection="row" alignItems="center">
                    <Text fontSize="$lg" fontWeight="$bold" style={{ textAlign: 'left', flex: 1 }}>
                        약관 및 개인정보 수집, 이용 동의
                    </Text>
                    <Pressable onPress={onClose} style={{ textAlign: 'right'}}>
                        <Text fontSize="$lg">✕</Text>
                    </Pressable>
                </Box>

                {/* Body */}
                <ScrollView maxHeight={380} pt={18} pb={24}>
                    <VStack space="md">
                        <Pressable onPress={() => setAll(!allChecked)}>
                            <Text fontSize="$md" fontWeight="$bold" color={allChecked ? colors['main-blue-1'] : colors['black']}>
                                ✔ 전체 동의
                            </Text>
                        </Pressable>
                        <AgreementItem
                            label="만 14세 이상입니다."
                            checked={agreements.age}
                            onPress={() => toggle("age")}
                        />
                        <AgreementItem
                            label="[필수] 서비스 이용약관 동의"
                            checked={agreements.terms}
                            onPress={() => toggle("terms")}
                        />
                        <AgreementItem
                            label="[필수] 개인정보 수집 및 이용 동의"
                            checked={agreements.privacy}
                            onPress={() => toggle("privacy")}
                        />
                        <AgreementItem
                            label="[선택] 마케팅 정보 수신 동의"
                            checked={agreements.marketing}
                            onPress={() => toggle("marketing")}
                        />
                        {agreements.marketing && (
                            <VStack pl="$1" space="sm" style={{ marginLeft: 30 }}>
                                <AgreementSubItem label="푸시 알림" checked={agreements.push} onPress={() => toggle("push")} />
                                <AgreementSubItem label="이메일" checked={agreements.email} onPress={() => toggle("email")} />
                                <AgreementSubItem label="SMS" checked={agreements.sms} onPress={() => toggle("sms")} />
                            </VStack>
                        )}
                    </VStack>
                </ScrollView>

                {/* Footer */}
                <Box pb="$3">
                    <Button
                        text="스트라이더로 시작하기"
                        disabled={!allRequiredChecked()}
                        onPress={handleSignUp}
                        variant="primary"
                        size="large"/>
                </Box>
                </View>
            </ActionsheetContent>
        </Actionsheet>
    );
}

function AgreementItem({ label, checked, onPress }) {
    return (
        <Pressable onPress={onPress}>
            <Text
                fontSize="$md"
                fontWeight="$medium"
                color={checked ? colors['main-blue-1'] : colors['black']}
            >
                ✔ {label}
            </Text>
        </Pressable>
    );
}

function AgreementSubItem({ label, checked, onPress }) {
    return (
        <Pressable onPress={onPress}>
            <Text fontSize="$sm" color={checked ? colors['main-blue-1'] : colors['black']}>
                ✔ {label}
            </Text>
        </Pressable>
    );
}