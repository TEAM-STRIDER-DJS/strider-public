import React from "react";
import { View, Text, Pressable } from "react-native";
import { HStack } from "@gluestack-ui/themed";
import BackButton from "@src/components/common/BackButton";

const TopBar = ({ title, rightComponent, showBack = true }) => {
  return (
    <HStack className="py-5 px-5 bg-white flex items-center justify-between">
      <View className="flex-1 items-start">{showBack && <BackButton />}</View>
      <Text className="flex-2 text-black text-xl font-semibold text-center">
        {title}
      </Text>
      <View className="flex-1 items-end">
        {rightComponent ? rightComponent : <Pressable />}
      </View>
    </HStack>
  );
};

export default TopBar;
