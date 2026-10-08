import Button from "@src/components/common/Button";

export const FollowToggleButton = ({ followStatus, onPress, disabled }) => {
  let text = "팔로우";
  let variant = "primary";

  if (followStatus === "FOLLOWING") {
    text = "팔로잉";
    variant = "outline";
  }

  if (followStatus === "REQUESTED") {
    text = "요청됨";
    variant = "requested";
  }

  return (
    <Button
      text={text}
      variant={variant}
      size="medium"
      fullWidth={false}
      disabled={disabled}
      onPress={onPress}
    />
  );
};
