import { requireAuthenticatedUser } from "../../server/auth.js";
import { findAccessibleConversation, isValidConversationId } from "../../server/conversation-access.js";
import { connectToDatabase } from "../../server/db.js";
import { handleApiError, allowMethods, sendJson } from "../../server/http.js";
import { conversationParticipantFields, serializeConversation } from "../../server/conversation.js";
import Conversation from "../../models/Conversation.js";

export default async function conversationById(req, res) {
  if (!allowMethods(req, res, ["GET"])) return;
  const userId = await requireAuthenticatedUser(req, res);
  if (!userId) return;

  const conversationId = req.query?.conversationId;
  if (!isValidConversationId(conversationId)) {
    return sendJson(res, 400, { error: "A valid conversation ID is required." });
  }

  try {
    await connectToDatabase();
    const conversation = await findAccessibleConversation(conversationId, userId);
    if (!conversation) {
      return sendJson(res, 404, { error: "Conversation not found or unavailable." });
    }

    const populated = await Conversation.findById(conversationId)
      .populate({ path: "problem", select: "title subject" })
      .populate({ path: "solution", select: "status" })
      .populate({ path: "problemAuthor", select: conversationParticipantFields })
      .populate({ path: "solutionProvider", select: conversationParticipantFields })
      .lean();

    if (!populated?.problem || populated.solution?.status !== "APPROVED") {
      return sendJson(res, 404, { error: "Conversation not found or unavailable." });
    }
    return sendJson(res, 200, {
      conversation: serializeConversation(populated, userId),
    });
  } catch (error) {
    return handleApiError(res, error, "Conversation detail");
  }
}
