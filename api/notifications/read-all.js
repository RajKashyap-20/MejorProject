import { requireAuthenticatedUser } from "../../server/auth.js";
import { connectToDatabase } from "../../server/db.js";
import { handleApiError, allowMethods, parseJsonBody, sendJson } from "../../server/http.js";
import Notification from "../../models/Notification.js";

export default async function markAllNotificationsRead(req, res) {
  if (!allowMethods(req, res, ["PATCH"])) return;
  const userId = await requireAuthenticatedUser(req, res);
  if (!userId) return;

  try {
    const body = parseJsonBody(req.body);
    if (Object.keys(body).length) {
      return sendJson(res, 400, { error: "No notification fields can be changed." });
    }
  } catch (error) {
    return sendJson(res, 400, { error: error.message });
  }

  try {
    await connectToDatabase();
    const result = await Notification.updateMany(
      { recipientId: userId, read: false },
      { $set: { read: true } },
    );
    return sendJson(res, 200, { markedRead: result.modifiedCount });
  } catch (error) {
    return handleApiError(res, error, "Mark all notifications read");
  }
}
