import mongoose from "mongoose";
import { requireAuthenticatedUser } from "../../server/auth.js";
import { connectToDatabase } from "../../server/db.js";
import { handleApiError, allowMethods, parseJsonBody, sendJson } from "../../server/http.js";
import Notification from "../../models/Notification.js";

export default async function notificationById(req, res) {
  if (!allowMethods(req, res, ["PATCH"])) return;
  const userId = await requireAuthenticatedUser(req, res);
  if (!userId) return;

  const notificationId = req.query?.notificationId;
  if (
    typeof notificationId !== "string" ||
    !mongoose.isObjectIdOrHexString(notificationId)
  ) {
    return sendJson(res, 400, { error: "A valid notification ID is required." });
  }
  try {
    const body = parseJsonBody(req.body);
    if (Object.keys(body).length) {
      return sendJson(res, 400, { error: "Notifications can only be marked as read." });
    }
  } catch (error) {
    return sendJson(res, 400, { error: error.message });
  }

  try {
    await connectToDatabase();
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipientId: userId },
      { $set: { read: true } },
      { new: true },
    )
      .select("type message relatedProblemId relatedSolutionId relatedConversationId read createdAt")
      .lean();
    if (!notification) {
      return sendJson(res, 404, { error: "Notification not found." });
    }
    return sendJson(res, 200, { notification });
  } catch (error) {
    return handleApiError(res, error, "Mark notification read");
  }
}
