// src/components/common/Button.js
import { Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Pressable } from "@gluestack-ui/themed";

export default function Button({
  text,
  onPress,
  disabled = false,
  variant = "primary", // 'primary', 'secondary', 'outline'
  size = "medium", // 'small', 'medium', 'large'
  fullWidth = true,
  className = "",
  textClassName = "",
  icon,
  iconPosition = "left", // 'left' or 'right'
}) {
  const variantMap = {
    primary: "bg-main-blue-1",
    secondary: "bg-section-color",
    outline: "border border-dark-font bg-transparent",
    naverGreen: `bg-green-600`,
    kakaoYellow: `bg-yellow-400`,
    requested: "border border-gray-400 bg-transparent",
    white: "bg-white",
  };

  const variantTextMap = {
    primary: "text-white",
    secondary: "text-black",
    outline: "text-dark-font",
    requested: "text-gray-400",
    white: "text-black",
  };

  const sizeMap = {
    small: "h-8 px-3",
    medium: "h-10 px-4",
    large: "h-12 px-5",
  };

  const widthStyle = fullWidth ? "w-full" : "self-auto";

  const iconSizeMap = {
    small: 16,
    medium: 20,
    large: 24,
  };

  const iconMarginMap = {
    small: 4,
    medium: 8,
    large: 12,
  };

  const disabledStyle = disabled ? "bg-section-color" : "";

  const variantStyle = variantMap[variant] ?? "";
  const variantTextStyle = variantTextMap[variant] ?? "";
  const sizeStyle = sizeMap[size] ?? "";

  const iconSize = iconSizeMap[size] ?? 20;
  const iconMargin = iconMarginMap[size] ?? 8;

  const combinedClassName = `
  rounded-md justify-center items-center flex-row
  ${variantStyle}
  ${sizeStyle}
  ${widthStyle}
  ${disabledStyle}
  ${className}
`.trim();

  const combinedTextClassName = `
    font-semibold text-base
    ${variantTextStyle}
    ${textClassName}
  `.trim();

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      className={combinedClassName}
    >
      {icon && iconPosition === "left" && (
        <Ionicons
          name={icon}
          size={iconSize}
          color={variantTextStyle.includes("text-white") ? "white" : "black"}
          style={{ marginRight: iconMargin }}
        />
      )}
      <Text className={combinedTextClassName}>{text}</Text>
      {icon && iconPosition === "right" && (
        <Ionicons
          name={icon}
          size={iconSize}
          color={variantTextStyle.includes("text-white") ? "white" : "black"}
          style={{ marginLeft: iconMargin }}
        />
      )}
    </Pressable>
  );
}
