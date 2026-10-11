import { requireAdminUser } from "../../server/admin.js";
import { handleApiError, allowMethods, sendJson } from "../../server/http.js";
import Conversation from "../../models/Conversation.js";
import Notification from "../../models/Notification.js";
import Problem from "../../models/Problem.js";
import Solution from "../../models/Solution.js";
import User from "../../models/User.js";

export default async function adminStats(req, res) {
  if (!allowMethods(req, res, ["GET"])) return;
  try {
    const adminId = await requireAdminUser(req, res);
    if (!adminId) return;
    const [users, problems, solutions, conversations, unreadNotifications] =
      await Promise.all([
        User.countDocuments(),
        Problem.countDocuments(),
        Solution.countDocuments(),
        Conversation.countDocuments(),
        Notification.countDocuments({ read: false }),
      ]);
    return sendJson(res, 200, {
      stats: { users, problems, solutions, conversations, unreadNotifications },
    });
  } catch (error) {
    return handleApiError(res, error, "Admin statistics");
  }
}
