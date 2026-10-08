import React from "react";
import { TextInput, Text, View, Pressable } from "react-native";
import { twMerge } from "tailwind-merge";
import Feather from "@expo/vector-icons/Feather";

export default function EditTextInput({
  value,
  onChangeText,
  label = "",
  placeholder = "",
  keyboardType = "default",
  secureTextEntry = false,
  className = "",
  style = {},
  showClearButton = true,
  ...rest
}) {
  return (
    <View className="border border-gray-300 rounded-xl px-3 pt-3 pb-1 relative">
      <View className="relative">
        {label ? (
          <Text className="text-sm font-semibold text-black mb-1">{label}</Text>
        ) : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#999"
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          className={twMerge("text-base text-black p-0 pr-6", className)}
          style={[{ lineHeight: 20 }, style]}
          {...rest}
        />

        {showClearButton && (
          <Pressable
            onPress={() => onChangeText("")}
            className="absolute right-0 top-0 bottom-0 justify-center px-2"
          >
            <Feather name="x-circle" size={20} color="gray" />
          </Pressable>
        )}
      </View>
    </View>
  );
}
