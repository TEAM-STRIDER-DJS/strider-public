import { Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Pressable } from "@gluestack-ui/themed";

export default function ToggleButton({
  text,
  onPress,
  active = false,
  disabled = false,
  variant = "primary", // 'primary', 'secondary', 'outline'
  size = "medium", // 'small', 'medium', 'large'
  className = "",
  textClassName = "",
  icon,
  iconPosition = "left", // 'left' or 'right'
}) {
  const activeVariantMap = {
    primary: "bg-main-blue-1",
    secondary: "bg-section-color",
    outline: "border border-main-blue-1 bg-transparent",
  };

  const inactiveVariantMap = {
    primary: "bg-section-color",
    secondary: "bg-white",
    outline: "border border-dark-font bg-transparent",
  };

  const activeTextVariantMap = {
    primary: "text-white",
    secondary: "text-black",
    outline: "text-main-blue-1",
  };

  const inactiveTextVariantMap = {
    primary: "text-dark-font",
    secondary: "text-dark-font",
    outline: "text-dark-font",
  };

  const sizeMap = {
    small: "flex-1 h-8 px-2",
    medium: "flex-1 h-10 px-3",
    large: "flex-1 h-12 px-4",
  };

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

  const variantStyle = active
    ? activeVariantMap[variant] ?? ""
    : inactiveVariantMap[variant] ?? "";
  const variantTextStyle = active
    ? activeTextVariantMap[variant] ?? ""
    : inactiveTextVariantMap[variant] ?? "";
  const sizeStyle = sizeMap[size] ?? "";

  const iconSize = iconSizeMap[size] ?? 20;
  const iconMargin = iconMarginMap[size] ?? 8;

  const combinedClassName = `
    rounded-xl justify-center items-center flex-row
    ${variantStyle}
    ${sizeStyle}
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
