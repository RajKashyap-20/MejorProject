import mongoose from "mongoose";
import { requireAuthenticatedUser } from "../../../server/auth.js";
import { findAccessibleConversation, isValidConversationId } from "../../../server/conversation-access.js";
import { connectToDatabase } from "../../../server/db.js";
import { createPrivateImageUrl } from "../../../server/images.js";
import { handleApiError, allowMethods, parseJsonBody, sendJson } from "../../../server/http.js";
import { validateMessage } from "../../../server/message-validation.js";
import { serializeMessage } from "../../../server/conversation.js";
import { createNotification } from "../../../server/notifications.js";
import Conversation from "../../../models/Conversation.js";
import Message from "../../../models/Message.js";

const HISTORY_LIMIT = 50;
const POLL_LIMIT = 100;

function readAfter(req) {
  const value = req.query?.after;
  if (value === undefined) return null;
  if (typeof value !== "string" || Array.isArray(value)) {
    throw new Error("The after cursor must be a single timestamp.");
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error("The after cursor is invalid.");
  return date;
}

export default async function conversationMessages(req, res) {
  if (!allowMethods(req, res, ["GET", "POST"])) return;
  const userId = await requireAuthenticatedUser(req, res);
  if (!userId) return;

  const conversationId = req.query?.conversationId;
  if (!isValidConversationId(conversationId)) {
    return sendJson(res, 400, { error: "A valid conversation ID is required." });
  }

  let after;
  let values;
  if (req.method === "GET") {
    try {
      after = readAfter(req);
    } catch (error) {
      return sendJson(res, 400, { error: error.message });
    }
  } else {
    try {
      values = validateMessage(parseJsonBody(req.body), conversationId);
    } catch (error) {
      return sendJson(res, 400, { error: error.message });
    }
  }

  try {
    await connectToDatabase();
    const conversation = await findAccessibleConversation(conversationId, userId);
    if (!conversation) {
      return sendJson(res, 404, { error: "Conversation not found or unavailable." });
    }

    if (req.method === "POST") {
      const message = await Message.create({
        conversation: conversationId,
        sender: userId,
        ...values,
        readBy: [userId],
      });
      const recipientId = conversation.problemAuthor.toString() === userId
        ? conversation.solutionProvider
        : conversation.problemAuthor;
      await createNotification({
        recipientId,
        actorId: userId,
        type: "CHAT_MESSAGE",
        message: "You received a private chat message.",
        relatedProblemId: conversation.problem,
        relatedSolutionId: conversation.solution,
        relatedConversationId: conversation._id,
      });
      await Conversation.updateOne(
        { _id: conversationId },
        { $set: { updatedAt: message.createdAt } },
      );
      await message.populate({ path: "sender", select: "name profilePictureUrl" });
      return sendJson(res, 201, {
        message: serializeMessage(
          message,
          message.imagePublicId ? createPrivateImageUrl(message.imagePublicId) : "",
        ),
      });
    }

    if (!after) {
      await Message.updateMany(
        {
          conversation: conversationId,
          sender: { $ne: new mongoose.Types.ObjectId(userId) },
          readBy: { $nin: [new mongoose.Types.ObjectId(userId)] },
        },
        { $addToSet: { readBy: new mongoose.Types.ObjectId(userId) } },
      );
    }

    const baseFilter = { conversation: conversationId };
    let messages;
    if (after) {
      messages = await Message.find({
        ...baseFilter,
        createdAt: { $gt: after },
      })
        .populate({ path: "sender", select: "name profilePictureUrl" })
        .sort({ createdAt: 1, _id: 1 })
        .limit(POLL_LIMIT)
        .lean();
    } else {
      messages = await Message.find(baseFilter)
        .populate({ path: "sender", select: "name profilePictureUrl" })
        .sort({ createdAt: -1, _id: -1 })
        .limit(HISTORY_LIMIT)
        .lean();
      messages.reverse();
    }

    const unreadIds = messages
      .filter((message) => (
        message.sender._id.toString() !== userId &&
        !message.readBy.some((readerId) => readerId.toString() === userId)
      ))
      .map((message) => message._id);
    if (unreadIds.length) {
      await Message.updateMany(
        { _id: { $in: unreadIds }, conversation: conversationId },
        { $addToSet: { readBy: new mongoose.Types.ObjectId(userId) } },
      );
      for (const message of messages) {
        if (unreadIds.some((id) => id.equals(message._id))) {
          message.readBy.push(new mongoose.Types.ObjectId(userId));
        }
      }
    }

    return sendJson(res, 200, {
      messages: messages.map((message) => serializeMessage(
        message,
        message.imagePublicId ? createPrivateImageUrl(message.imagePublicId) : "",
      )),
    });
  } catch (error) {
    return handleApiError(res, error, "Conversation messages");
  }
}
