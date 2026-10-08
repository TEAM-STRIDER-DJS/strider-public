/**
 * 채팅 메시지 타입 유틸.
 *
 * 서버(MessageResponse)가 messageType과 media[]를 내려주므로
 * content 문자열을 파싱해서 이미지인지 추측하면 안 된다.
 * (미디어 메시지는 서버 정책상 content가 항상 빈 문자열이라 애초에 판별 근거가 없다)
 */

/** Message.MessageType — 서버 enum과 1:1 */
export const MESSAGE_TYPE = {
    TEXT: 'TEXT',
    IMAGE: 'IMAGE',
    VIDEO: 'VIDEO',
    NOTICE: 'NOTICE',
};

/** MessageMedia.MediaType — 서버 enum과 1:1 */
export const MEDIA_TYPE = {
    IMAGE: 'IMAGE',
    VIDEO: 'VIDEO',
};

/** ChatService.MAX_IMAGE_COUNT */
export const MAX_IMAGE_COUNT = 10;

/**
 * 메시지 타입 판별.
 * 구버전 메시지 등으로 messageType이 비어 있으면 TEXT로 본다.
 */
export const getMessageType = (msg) => msg?.messageType || MESSAGE_TYPE.TEXT;

export const isMediaMessage = (msg) => {
    const type = getMessageType(msg);
    return type === MESSAGE_TYPE.IMAGE || type === MESSAGE_TYPE.VIDEO;
};

export const isNoticeMessage = (msg) => getMessageType(msg) === MESSAGE_TYPE.NOTICE;

/** 첨부 미디어 목록 (서버가 sortOrder ASC로 주지만 방어적으로 한 번 더 정렬) */
export const getMediaList = (msg) => {
    if (!Array.isArray(msg?.media) || msg.media.length === 0) return [];
    return [...msg.media].sort((a, b) => (a?.sortOrder ?? 0) - (b?.sortOrder ?? 0));
};

/**
 * 말풍선에 그릴 작은 이미지 URL.
 * 이미지는 thumbnail, 영상은 preview를 쓴다 (group-chat-test.html:381 참고).
 * 둘 다 없으면 원본으로 폴백.
 */
export const getMediaThumbnailUrl = (media) => {
    if (!media) return null;
    const small = media.mediaType === MEDIA_TYPE.VIDEO ? media.previewUrl : media.thumbnailUrl;
    return small || media.originalUrl || null;
};

/**
 * 낙관적 전송/중복 제거용 클라이언트 메시지 ID.
 * 서버가 (roomId, clientMessageId)로 중복 저장을 막고, 응답에도 그대로 실어 준다.
 */
export const generateClientMessageId = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
};

/**
 * 업로드 결과(uploadMediaWithPreview)를 /pub/chat/send의 media 아이템으로 변환.
 * 이미지는 thumbnail*, 영상은 preview* 필드를 채운다 (MessageSendRequest.MediaItem).
 */
export const toMediaItem = ({ mediaType, original, preview }) => {
    const item = {
        mediaType,
        originalUrl: original.url,
        originalS3Key: original.s3Key,
    };
    if (mediaType === MEDIA_TYPE.VIDEO) {
        item.previewUrl = preview?.url;
        item.previewS3Key = preview?.s3Key;
    } else {
        item.thumbnailUrl = preview?.url;
        item.thumbnailS3Key = preview?.s3Key;
    }
    return item;
};
