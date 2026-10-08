import { api } from "@src/lib/api";
import { titleOf } from "@src/config/notificationTabs";
import { formatImageUrl } from "@src/utils/image";

// ────────────────────────────────────────────────────────────────────────────
// Notification (알림) — strider-notification 서비스 /api/v1/noti 연동
// ────────────────────────────────────────────────────────────────────────────
// 화면에서 쓰는 알림 객체 형태:
//   { id, type, title, content, createdAt, thumbnail, actorProfileImage, actorUserId, resourceId, isRead }
//   type 은 백엔드 NotificationType (LIKE/COMMENT/COMMENT_LIKE/POST/CHAT/
//   FOLLOW/FOLLOW_REQUEST/FOLLOW_ACCEPTED ...). 탭 분류는 notificationTabs 참고.
// ────────────────────────────────────────────────────────────────────────────

// 백엔드 NotificationResponse → 화면 알림 객체
const toNotification = (n) => ({
  id: String(n.id),
  type: n.eventType,
  title: titleOf(n.eventType),
  content: n.content,
  createdAt: n.createdAt,
  thumbnail: formatImageUrl(n.resourceThumbnailUrl),
  actorProfileImage: formatImageUrl(n.actorProfileImageUrl),
  actorUserId: n.actorUserId,
  resourceId: n.resourceId,
  targetFeedPostId: n.targetFeedPostId ?? null,
  isRead: n.isRead,
});

/**
 * 알림 목록 조회 — GET /api/v1/strider/noti (Slice 페이징)
 */
export const getNotificationsApi = async (page = 0, size = 30) => {
  const res = await api.get(`/api/v1/strider/noti?page=${page}&size=${size}`);
  // StriderResponse(success) → data 안에 Slice({ content: [...] })
  const raw = res.data?.data ?? res.data;
  const list = Array.isArray(raw) ? raw : (raw?.content ?? []);
  return list.map(toNotification);
};

/**
 * 알림 전체 삭제
 *
 * ⚠️ strider-notification 에 전체 삭제 엔드포인트가 아직 없음.
 * 현재는 로컬(캐시)에서만 비움. 백엔드에 DELETE 추가되면 여기서 호출.
 */
export const deleteAllNotificationsApi = async () => {
  return { success: true };
};

/**
 * 알림 읽음 처리 — PATCH /api/v1/strider/noti/{id}/read
 */
export const markNotificationReadApi = async (id) => {
  const res = await api.patch(`/api/v1/strider/noti/${id}/read`);
  return res.data;
};

/**
 * 알림 단건 삭제 — DELETE /api/v1/strider/noti/{id}
 */
export const deleteNotificationApi = async (id) => {
  const res = await api.delete(`/api/v1/strider/noti/${id}`);
  return res.data;
};

/**
 * FCM 디바이스 토큰 등록 — POST /api/v1/strider/noti/device-token
 * userId는 백엔드가 인증 토큰에서 추출하므로 body엔 token만 전달
 */
export const registerDeviceTokenApi = async (token) => {
  const res = await api.post(`/api/v1/strider/noti/device-token`, { token });
  return res.data;
};
