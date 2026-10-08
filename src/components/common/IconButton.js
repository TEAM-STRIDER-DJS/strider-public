import { Ionicons } from "@expo/vector-icons";
import { Pressable } from "@gluestack-ui/themed";

export default function IconButton({
  icon,
  onPress,
  size = "medium", // 'small', 'medium', 'large'
  className = "",
  innerClassName = "",
}) {
  const iconSizeMap = {
    small: 16,
    medium: 20,
    large: 24,
  };

  const iconSize = iconSizeMap[size] ?? 20;

  const combinedClassName = `
    rounded-xl justify-center items-center flex-row
    ${className}
  `.trim();

  const combinedInnerClassName = `
    justify-center items-center
    ${innerClassName}
  `.trim();

  return (
    <Pressable
      onPress={onPress}
      className={combinedClassName}
      accessibilityRole="button"
    >
      <View className={combinedInnerClassName}>
        <Ionicons name={icon} size={iconSize} />
      </View>
    </Pressable>
  );
}
