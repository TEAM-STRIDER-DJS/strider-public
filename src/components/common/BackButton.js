import { twMerge } from "tailwind-merge";
import { useRouter } from "expo-router";
import AntDesign from "@expo/vector-icons/AntDesign";
import { Pressable } from "@gluestack-ui/themed";

export default function BackButton({ className = "" }) {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.back()}
      className={twMerge("justify-center", className)}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <AntDesign name="left" size={18} color="black" />
    </Pressable>
  );
}
