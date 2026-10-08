import React from "react";
import { useAuthStore } from "@src/store/authStore";
import ProfileScreen from "@src/components/ui/ProfileScreen";
import { Pressable } from "@gluestack-ui/themed";
import SimpleLineIcons from "@expo/vector-icons/SimpleLineIcons";
import { router } from "expo-router";

export default function MyProfileScreen() {
  const userId = useAuthStore((state) => state.userId);

  return (
    <ProfileScreen
      userId={userId}
      isMe
      rightAction={
        <Pressable onPress={() => router.push("(setting)/settings")}>
          <SimpleLineIcons name="menu" size={18} color="black" />
        </Pressable>
      }
    />
  );
}
