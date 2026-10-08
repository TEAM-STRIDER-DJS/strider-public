import { requireRuntimeUrl } from "@src/config/runtime";
/**
 * 백엔드에서 반환되는 상대경로(uploads/...) 형태의 이미지 URL을
 * S3 버킷 절대경로 주소로 보정해주는 유틸리티 함수입니다.
 */
export const formatImageUrl = (url) => {
    if (!url) return null;
    if (typeof url !== "string") return null;
    
    // 이미 완전한 HTTP 절대경로인 경우 그대로 반환
    if (url.startsWith("http://") || url.startsWith("https://")) {
        return url;
    }
    
    // 상대경로 접두사 / 제거 후 S3 버킷 도메인 결합
    const cleanUrl = url.startsWith("/") ? url.substring(1) : url;
    return `${requireRuntimeUrl("mediaBaseUrl")}/${cleanUrl}`;
};
