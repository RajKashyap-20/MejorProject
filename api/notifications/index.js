import { requireAuthenticatedUser } from "../../server/auth.js";
import { connectToDatabase } from "../../server/db.js";
import { handleApiError, allowMethods, sendJson } from "../../server/http.js";
import { serializeNotification } from "../../server/notifications.js";
import Notification from "../../models/Notification.js";

export default async function notifications(req, res) {
  if (!allowMethods(req, res, ["GET"])) return;
  const userId = await requireAuthenticatedUser(req, res);
  if (!userId) return;

  try {
    await connectToDatabase();
    const [records, unreadCount] = await Promise.all([
      Notification.find({ recipientId: userId })
        .select("type message relatedProblemId relatedSolutionId relatedConversationId read createdAt")
        .sort({ createdAt: -1 })
        .limit(30)
        .lean(),
      Notification.countDocuments({ recipientId: userId, read: false }),
    ]);

    return sendJson(res, 200, {
      notifications: records.map(serializeNotification),
      unreadCount,
    });
  } catch (error) {
    return handleApiError(res, error, "Notifications");
  }
}
