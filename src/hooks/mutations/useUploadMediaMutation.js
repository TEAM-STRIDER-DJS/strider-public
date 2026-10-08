import { useMutation } from "@tanstack/react-query";
import { uploadMediaWithPreview } from "@src/api/mediaApi";

export const useUploadMediaMutation = () => {
  return useMutation({
    mutationKey: ["uploadMedia"],
    mutationFn: uploadMediaWithPreview,
  });
};
