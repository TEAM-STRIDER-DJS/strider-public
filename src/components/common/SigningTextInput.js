import React from "react";
import { TextInput } from "react-native";
import { twMerge } from "tailwind-merge";

export default function SigningTextInput({
  value,
  onChangeText,
  placeholder = "",
  keyboardType = "default",
  secureTextEntry = false,
  className = "",
  ...rest
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#999"
      keyboardType={keyboardType}
      secureTextEntry={secureTextEntry}
      className={twMerge(
        "h-12 bg-gray-100 rounded-md px-4 text-base text-black leading-[18px]",
        className
      )}
      {...rest}
    />
  );
}
