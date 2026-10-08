// 알림 탭 분류
// 백엔드 NotificationType(eventType) → 어느 탭에 속하는지 매핑

export const NOTIFICATION_TABS = [
  { key: "ALL", label: "전체" },
  { key: "FEED", label: "피드" },
  { key: "FOLLOW", label: "팔로잉" },
  { key: "MESSAGE", label: "메시지" },
];

// 각 탭에 포함되는 알림 타입들 ("FEED"/"MESSAGE"는 mock 호환용 별칭)
const TAB_TYPES = {
  FEED: ["FEED", "LIKE", "COMMENT", "COMMENT_LIKE", "POST"],
  FOLLOW: ["FOLLOW", "FOLLOW_REQUEST", "FOLLOW_ACCEPTED"],
  MESSAGE: [
    "MESSAGE",
    "CHAT",
    "MESSAGE_REQUEST",
    "MESSAGE_RECEIVE",
    "MESSAGE_NOTIFICATION",
  ],
};

/** 해당 알림이 특정 탭에 속하는지 */
export const matchesTab = (type, tabKey) => {
  if (tabKey === "ALL") return true;
  return (TAB_TYPES[tabKey] ?? []).includes(type);
};

/** 피드 계열(썸네일 노출 대상) 여부 */
export const isFeedType = (type) => TAB_TYPES.FEED.includes(type);

// eventType → 화면에 표시할 제목 (백엔드 응답엔 title이 없어 프론트에서 생성)
const TYPE_TITLES = {
  LIKE: "피드 좋아요 알림",
  COMMENT: "피드 댓글 알림",
  COMMENT_LIKE: "댓글 좋아요 알림",
  POST: "새 게시물 알림",
  FOLLOW: "팔로우 알림",
  FOLLOW_REQUEST: "팔로우 요청",
  FOLLOW_ACCEPTED: "팔로우 수락",
  CHAT: "메시지 알림",
};

export const titleOf = (type) => TYPE_TITLES[type] ?? "알림";

/** 알림 탭 시 이동할 경로 (이동 대상이 없으면 null) */
export const getNotificationRoute = (item) => {
  const { type, actorUserId, targetFeedPostId, resourceId } = item;

  if (TAB_TYPES.FOLLOW.includes(type)) {
    return actorUserId ? `/(profile)/${actorUserId}/profileInfo` : null;
  }

  if (isFeedType(type)) {
    // COMMENT_LIKE는 resourceId가 commentId라 targetFeedPostId 없이는 이동 불가
    const feedPostId =
      targetFeedPostId ?? (type === "COMMENT_LIKE" ? null : resourceId);
    return feedPostId ? `/feed/${feedPostId}` : null;
  }

  if (TAB_TYPES.MESSAGE.includes(type)) {
    return resourceId ? `/chat/${resourceId}` : null;
  }

  return null;
};
