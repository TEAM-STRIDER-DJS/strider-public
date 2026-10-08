import React, { useState, useEffect } from "react";
import { View, Text } from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import Feather from "@expo/vector-icons/Feather";
import AntDesign from "@expo/vector-icons/AntDesign";

import { useAuthStore } from "@src/store/authStore";
import { useProfileQuery } from "@src/hooks/queries/useProfileQuery";
import { useUploadMediaMutation } from "@src/hooks/mutations/useUploadMediaMutation";
import { useUpdateProfileImageMutation } from "@src/hooks/mutations/useUpdateProfileMutation";
import TopBar from "@src/components/common/TopBar";

import {
  VStack,
  Avatar,
  AvatarBadge,
  AvatarImage,
  SafeAreaView,
  Pressable,
} from "@gluestack-ui/themed";

/* ------------------ 메인 콘텐츠 ------------------ */
const MainContent = ({ avatarUri, openModal, handleDeleteImage, userData }) => {
  const router = useRouter();

  return (
    <View className="flex-1 py-5 px-5">
      {/* 프로필 이미지 */}
      <View className="items-center mb-5">
        <Avatar size="xl">
          <AvatarImage
            key={avatarUri}
            source={
              avatarUri
                ? { uri: avatarUri }
                : require("@assets/strider-logo.png")
            }
            alt="프로필 이미지"
          />
          <AvatarBadge
            bgColor="$black"
            height={30}
            width={30}
            className="items-center justify-center"
          >
            <Feather
              name="camera"
              size={18}
              color="white"
              onPress={openModal}
            />
          </AvatarBadge>
        </Avatar>

        <Pressable onPress={handleDeleteImage}>
          <Text className="text-gray-500 text-sm font-bold mt-2">
            이미지 삭제
          </Text>
        </Pressable>
      </View>

      {/* 아이디 */}
      <View className="mb-5">
        <Text className="font-bold mb-2">아이디</Text>
        <View className="flex-row items-center">
          <Text
            className="flex-1 mr-2 text-black"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {userData.profileId}
          </Text>
        </View>
      </View>

      {/* 닉네임 */}
      <View className="mb-5">
        <Text className="font-bold mb-2">사용자 이름</Text>
        <Pressable
          className="flex-row items-center"
          onPress={() => router.push({ pathname: "/editNickname" })}
        >
          <Text
            className="flex-1 mr-2 text-black"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {userData.nickname}
          </Text>
          <AntDesign name="right" size={14} color="gray" />
        </Pressable>
      </View>

      {/* 소개 */}
      <View>
        <Text className="font-bold mb-2">소개</Text>
        <Pressable
          className="flex-row items-center"
          onPress={() => router.push({ pathname: "/editProfileDesc" })}
        >
          <Text
            className="flex-1 mr-2 text-black"
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {userData.profileDesc}
          </Text>
          <AntDesign name="right" size={14} color="gray" />
        </Pressable>
      </View>
    </View>
  );
};

/* ------------------ 화면 ------------------ */
export default function EditProfileScreen() {
  const userId = useAuthStore((state) => state.userId);

  const { data: userData } = useProfileQuery(userId);
  const uploadMediaMutation = useUploadMediaMutation();
  const updateProfileImageMutation = useUpdateProfileImageMutation(userId);

  const [avatarUri, setAvatarUri] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (userData?.profileImage) {
      setAvatarUri(userData.profileImage);
    }
  }, [userData]);

  if (!userId || !userData) return null;

  /* -------- 이미지 업로드 -------- */
  const handleResult = (result) => {
    console.log("이미지 업로드 결과:");

    if (result.canceled) return;

    const image = result.assets?.[0];
    if (!image) return;

    uploadMediaMutation.mutate(image, {
      onSuccess: ({ original, preview }) => {
        updateProfileImageMutation.mutate({
          profileImage: original.url,
          profileThumbImage: preview.url,
          profileImageS3Key: original.s3Key,
          profileThumbS3Key: preview.s3Key,
        });

        setAvatarUri(original.url);
      },
    });
  };

  /* -------- 이미지 삭제 -------- */
  const handleDeleteImage = () => {
    console.log("이미지 삭제");
    updateProfileImageMutation.mutate({
      profileImage: null,
      profileThumbImage: null,
      profileImageS3Key: null,
      profileThumbS3Key: null,
    });

    setAvatarUri(null);
  };

  /* -------- 카메라 -------- */
  const pickFromCamera = async () => {
    setShowModal(false);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    handleResult(result);
  };

  /* -------- 갤러리 -------- */
  const pickFromGallery = async () => {
    setShowModal(false);

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    handleResult(result);
  };

  return (
    <>
      {showModal && (
        <>
          <Pressable
            className="absolute inset-0 bg-black/50 z-20"
            onPress={() => setShowModal(false)}
          />

          <View className="absolute bottom-0 left-0 right-0 px-6 pb-6 z-30">
            <View className="bg-white rounded-xl overflow-hidden mb-2">
              <Pressable className="py-4 items-center" onPress={pickFromCamera}>
                <Text className="text-base font-semibold">사진 찍기</Text>
              </Pressable>
              <Pressable
                className="py-4 items-center"
                onPress={pickFromGallery}
              >
                <Text className="text-base font-semibold">앨범에서 선택</Text>
              </Pressable>
            </View>
            <Pressable
              className="bg-white rounded-xl py-4 items-center"
              onPress={() => setShowModal(false)}
            >
              <Text className="text-red-500 font-semibold">취소</Text>
            </Pressable>
          </View>
        </>
      )}

      <SafeAreaView className="flex-1 bg-white">
        <VStack className="flex-1">
          <TopBar title="프로필 편집" />
          <MainContent
            avatarUri={avatarUri}
            openModal={() => setShowModal(true)}
            handleDeleteImage={handleDeleteImage}
            userData={userData}
          />
        </VStack>
      </SafeAreaView>
    </>
  );
}
