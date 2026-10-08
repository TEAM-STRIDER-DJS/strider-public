import React from "react";
import { View, Text, TouchableOpacity, Image, Platform } from "react-native";
import Button from "@src/components/common/Button";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  useSocialLogin,
} from "@src/hooks/mutations/useLoginMutation";
import Constants from "expo-constants";

// Native-only social login libraries
const kakaoLogin = Platform.OS !== "web" ? require("@react-native-seoul/kakao-login").login : null;
const NaverLogin = Platform.OS !== "web" ? require("@react-native-seoul/naver-login") : null;

const { naverClientId, naverClientSecret } = Constants.expoConfig?.extra || {};

const naverKeys = Platform.select({
  ios: {
    appName: "Strider",
    consumerKey: naverClientId,
    consumerSecret: naverClientSecret,
    serviceUrlSchemeIOS: `naver${naverClientId}`,
  },
  android: {
    appName: "Strider",
    consumerKey: naverClientId,
    consumerSecret: naverClientSecret,
    serviceUrlSchemeIOS: `naver${naverClientId}`,
    disableNaverAppAuthIOS: false,
  },
});

const loginWithNaver = () =>
  new Promise((resolve, reject) => {
    if (Platform.OS === "web") {
      alert("웹에서는 네이버 로그인을 지원하지 않습니다.");
      return resolve(null);
    }
    if (!naverClientId || !naverClientSecret) {
      return reject(new Error("네이버 로그인 키를 .env에 설정해 주세요."));
    }
    NaverLogin.initialize(naverKeys);

    NaverLogin.login(naverKeys, (err, token) => {
      if (err) reject(err);
      else resolve(token);
    });
  });

export default function Login() {
  const router = useRouter();

  const kakaoMutation = useSocialLogin("KAKAO");
  const naverMutation = useSocialLogin("NAVER");

    const handleKakaoLogin = async () => {
        if (!kakaoLogin || !Constants.expoConfig?.extra?.kakaoKey) {
            alert("카카오 로그인은 키가 설정된 네이티브 앱에서 사용할 수 있습니다.");
            return;
        }
        let token;
        try { token = await kakaoLogin(); }
        catch { alert("카카오 로그인에 실패했습니다."); return; }
        if (!token?.accessToken) return;
        kakaoMutation.mutate(token.accessToken, {
            onSuccess: () => {
                console.log("카카오 로그인 성공");
                router.push('(tabs)/home');
            },
            onError: (error) => {
                if (error.response?.status === 400) {
                    const accessToken = JSON.parse(error.config.data).accessToken;
                    // 소셜 회원가입 화면으로 이동
                    router.push({
                        pathname: '(auth)/signUp/phoneAuthenticationForSocial',
                        params: {
                                provider: 'KAKAO',
                            accessToken,
                        },
                    });
                } else {
                    console.error("카카오 로그인 실패");
                }
            }
        });
    };

    const handleNaverLogin = async () => {
        let token;
        try { token = await loginWithNaver(); }
        catch { alert("네이버 로그인 키와 설정을 확인해 주세요."); return; }
        if (!token?.accessToken) return;
        naverMutation.mutate(token.accessToken, {
            onSuccess: () => {
                console.log("네이버 로그인 성공");
                router.push('(tabs)/home');
            },
            onError: (error) => {
                if (error.response?.status === 400) {
                    const accessToken = JSON.parse(error.config.data).accessToken;
                    // 소셜 회원가입 화면으로 이동
                    router.push({
                        pathname: '(auth)/signUp/phoneAuthenticationForSocial',
                        params: {
                                provider: 'NAVER',
                            accessToken,
                        },
                    });
                } else {
                    console.error("네이버 로그인 실패");
                }
            }
        });
    };

  return (
    <View className="flex-1 bg-white pt-16 pb-10 px-6">
      <StatusBar style="dark" />

      <View className="gap-10">
        <View className="gap-[10px]">
          {/* 타이틀 */}
          <View className="mt-12 mb-6">
            <Text className="text-2xl font-bold text-center">반가워요!</Text>
            <Text className="text-xl font-semibold text-center mt-2">
              어떤 계정으로 시작할까요?
            </Text>
          </View>

                    {/* 로고 */}
                    <View className="self-center w-40 h-40 rounded-full overflow-hidden">
                        <Image
                        source={require('../../../assets/strider-logo.png')}
                        style={{ width: '100%', height: '100%' }}
                        />
                    </View>
                </View>

                <View className='gap-[30px]'>  
                    {/* 버튼 */}
                    <View className="gap-2">
                        <Button
                            text="스트라이더로 시작하기"
                            size="large"
                            onPress={() => router.push('(auth)/login/striderLogin')}
                        />

            <Button
              text="네이버로 시작하기"
              onPress={handleNaverLogin}
              variant="naverGreen"
              textClassName="text-white"
              size="large"
              disabled={naverMutation.isLoading}
            />

            <Button
              text="카카오로 시작하기"
              onPress={handleKakaoLogin}
              variant="kakaoYellow"
              textClassName="text-black"
              size="large"
              disabled={kakaoMutation.isLoading}
            />
          </View>

                    <View>
                        <TouchableOpacity
                            className="mt-6"
                            onPress={() => router.push('(auth)/findMyId/findMyId')}
                            >
                            <Text className="text-center text-gray-700">아이디 찾기</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
  );
}
