import React, { useState } from "react";
import { Text, View, Pressable } from "react-native";

const ExpandableText = ({
  children,
  textStyle,
  expandTextStyle,
  numberOfLines,
  maxChars = 30,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [visibleLineLength, setVisibleLineLength] = useState(0);

  const isLongText = visibleLineLength > maxChars;

  return (
    <View className="w-full">
      <Pressable onPress={() => setIsExpanded(!isExpanded)}>
        <Text
          numberOfLines={numberOfLines}
          className={textStyle}
          onTextLayout={(e) => {
            const lines = e.nativeEvent?.lines || [];
            const visibleLines = lines.slice(0, numberOfLines || 1);
            const length = visibleLines.reduce(
              (sum, line) => sum + line.text.length,
              0
            );
            setVisibleLineLength(length);
          }}
        >
          {isExpanded || !isLongText
            ? children
            : children.slice(0, maxChars) + "··· 더보기"}
        </Text>
      </Pressable>

      {isExpanded && (
        <Pressable
          onPress={() => setIsExpanded(false)}
          className="mt-1 self-end"
        >
          <Text className={expandTextStyle}>접기</Text>
        </Pressable>
      )}
    </View>
  );
};

export default ExpandableText;
