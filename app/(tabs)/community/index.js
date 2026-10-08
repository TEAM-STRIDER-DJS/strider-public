import React from "react";
import { Text, StyleSheet } from "react-native";
import { VStack, SafeAreaView } from "@gluestack-ui/themed";

const Community = () => {
  return (
    <SafeAreaView className="flex-1">
      <VStack style={Styles.container}>
        <Text style={Styles.HomeText}>Community</Text>
      </VStack>
    </SafeAreaView>
  );
};

export default Community;

const Styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  HomeText: {
    fontSize: 35,
    textAlign: "center",
  },
});
