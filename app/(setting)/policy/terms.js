import React from "react";
import { VStack, SafeAreaView } from "@gluestack-ui/themed";
import TopBar from "@src/components/common/TopBar";

const MainContent = () => <></>;

export default function EditProfileScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <VStack className="h-full w-full">
        <TopBar title="이용약관" />
        <MainContent />
      </VStack>
    </SafeAreaView>
  );
}
