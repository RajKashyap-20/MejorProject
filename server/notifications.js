import Notification from "../models/Notification.js";

export async function createNotification({
  recipientId,
  actorId,
  type,
  message,
  relatedProblemId = null,
  relatedSolutionId = null,
  relatedConversationId = null,
}) {
  if (recipientId.toString() === actorId.toString()) return null;

  return Notification.create({
    recipientId,
    actorId,
    type,
    message,
    relatedProblemId,
    relatedSolutionId,
    relatedConversationId,
  });
}

export function notificationHref(notification) {
  if (
    notification.type === "CHAT_MESSAGE" &&
    notification.relatedConversationId
  ) {
    return `/chat/${notification.relatedConversationId}`;
  }
  if (notification.relatedProblemId) {
    const suffix = notification.relatedSolutionId
      ? `#solution-${notification.relatedSolutionId}`
      : "";
    return `/problems/${notification.relatedProblemId}${suffix}`;
  }
  return "/feed";
}

export function serializeNotification(notification) {
  return {
    id: notification._id.toString(),
    type: notification.type,
    message: notification.message,
    relatedProblemId: notification.relatedProblemId?.toString() ?? null,
    relatedSolutionId: notification.relatedSolutionId?.toString() ?? null,
    relatedConversationId: notification.relatedConversationId?.toString() ?? null,
    read: notification.read,
    createdAt: notification.createdAt,
    href: notificationHref(notification),
  };
}
