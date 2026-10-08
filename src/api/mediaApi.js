import { api } from "@src/lib/api";
import * as ImageManipulator from "expo-image-manipulator";
import * as VideoThumbnails from "expo-video-thumbnails";
// SDK 54: 레거시 메서드(uploadAsync 등)는 메인 엔트리에서 제거되어 호출 시 throw 됨
import * as FileSystem from "expo-file-system/legacy";

/**
 * Presigned URL 요청
 */
const getPresignedUrl = async ({ filename, contentType, type }) => {
  const res = await api.post("/api/v1/strider/media/presign", {
    filename,
    contentType,
    type,
  });

  return res.data.data; // { s3Key, presignedUrl, cloudFrontUrl }
};

/**
 * S3 업로드 (로컬 파일 URI를 네이티브 레벨에서 직접 읽어 전송)
 *
 * fetch(uri).blob()은 iOS에서 로컬 file:// URI를 제대로 읽지 못해
 * 빈 바이너리가 업로드되는 RN의 알려진 이슈가 있어, FileSystem.uploadAsync를 사용한다.
 */
const uploadToS3 = async ({ uploadUrl, localUri, contentType }) => {
  const result = await FileSystem.uploadAsync(uploadUrl, localUri, {
    httpMethod: "PUT",
    headers: { "Content-Type": contentType },
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
  });

  if (result.status < 200 || result.status >= 300) {
    console.error("S3 upload failed");
    throw new Error(`S3 upload failed: ${result.status} ${result.body}`);
  }
};

/**
 * 이미지 썸네일 생성
 */
const createImageThumbnail = async (uri) => {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 200 } }],
    {
      compress: 0.7,
      format: ImageManipulator.SaveFormat.JPEG,
    }
  );

  return result.uri;
};

/**
 * 비디오 프리뷰 생성
 */
const createVideoPreview = async (uri) => {
  const { uri: thumbnailUri } = await VideoThumbnails.getThumbnailAsync(uri, {
    time: 1000,
  });

  return thumbnailUri;
};

/**
 * ⭐ 메인 업로드 함수 (원본 + 썸네일/프리뷰)
 */
export const uploadMediaWithPreview = async (file) => {
  if (!file?.uri) throw new Error("Invalid file");

  const isVideo = file.type === "video";
  const filename = file.name ?? file.uri.split("/").pop();

  const originalContentType = isVideo ? "video/mp4" : "image/jpeg";

  /* ---------------- 원본 업로드 ---------------- */
  const originalPresign = await getPresignedUrl({
    filename,
    contentType: originalContentType,
    type: "original",
  });

  await uploadToS3({
    uploadUrl: originalPresign.presignedUrl,
    localUri: file.uri,
    contentType: originalContentType,
  });

  /* ---------------- preview 생성 ---------------- */
  const previewUri = isVideo
    ? await createVideoPreview(file.uri)
    : await createImageThumbnail(file.uri);

  const previewFilename = isVideo
    ? `preview_${filename.replace(/\.[^/.]+$/, ".jpg")}`
    : `thumb_${filename}`;

  const previewPresign = await getPresignedUrl({
    filename: previewFilename,
    contentType: "image/jpeg",
    type: isVideo ? "preview" : "thumbnail",
  });

  await uploadToS3({
    uploadUrl: previewPresign.presignedUrl,
    localUri: previewUri,
    contentType: "image/jpeg",
  });

  /* ---------------- 결과 ---------------- */
  return {
    original: {
      s3Key: originalPresign.s3Key,
      url: originalPresign.cloudFrontUrl,
    },
    preview: {
      s3Key: previewPresign.s3Key,
      url: previewPresign.cloudFrontUrl,
    },
  };
};
