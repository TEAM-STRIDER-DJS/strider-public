import React from "react";
import { Text, StyleSheet } from "react-native";
import { VStack , SafeAreaView } from "@gluestack-ui/themed";

const Group = () => {

  return (
    <SafeAreaView className='flex-1'>
      <VStack style={Styles.container}>      
        <Text style={Styles.HomeText}>Group</Text>
      </VStack>
    </SafeAreaView>
  )
}

export default Group;

const Styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  HomeText: {
    fontSize: 35,
    textAlign: "center",
  },
})