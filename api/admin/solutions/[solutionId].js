import mongoose from "mongoose";
import { requireAdminUser } from "../../../server/admin.js";
import { handleApiError, allowMethods, sendJson } from "../../../server/http.js";
import Conversation from "../../../models/Conversation.js";
import Message from "../../../models/Message.js";
import Notification from "../../../models/Notification.js";
import Solution from "../../../models/Solution.js";

export default async function removeSolution(req, res) {
  if (!allowMethods(req, res, ["DELETE"])) return;
  try {
    const adminId = await requireAdminUser(req, res);
    if (!adminId) return;
    const solutionId = req.query?.solutionId;
    if (typeof solutionId !== "string" || !mongoose.isObjectIdOrHexString(solutionId)) {
      return sendJson(res, 400, { error: "A valid solution ID is required." });
    }
    const solution = await Solution.findByIdAndDelete(solutionId).select("_id").lean();
    if (!solution) return sendJson(res, 404, { error: "Solution not found." });

    const conversations = await Conversation.find({ solution: solutionId })
      .select("_id")
      .lean();
    const conversationIds = conversations.map((conversation) => conversation._id);
    await Promise.all([
      Message.deleteMany({ conversation: { $in: conversationIds } }),
      Conversation.deleteMany({ _id: { $in: conversationIds } }),
      Notification.deleteMany({
        $or: [
          { relatedSolutionId: solutionId },
          { relatedConversationId: { $in: conversationIds } },
        ],
      }),
    ]);
    return sendJson(res, 200, { message: "Solution and related private messages removed." });
  } catch (error) {
    return handleApiError(res, error, "Admin solution removal");
  }
}
