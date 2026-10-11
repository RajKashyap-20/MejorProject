import mongoose from "mongoose";
import { requireAuthenticatedUser } from "../../server/auth.js";
import { connectToDatabase } from "../../server/db.js";
import { handleApiError, allowMethods, parseJsonBody, sendJson } from "../../server/http.js";
import {
  conversationParticipantFields,
  serializeConversation,
} from "../../server/conversation.js";
import Conversation from "../../models/Conversation.js";
import Message from "../../models/Message.js";
import Problem from "../../models/Problem.js";
import Solution from "../../models/Solution.js";

export default async function conversations(req, res) {
  if (!allowMethods(req, res, ["GET", "POST"])) return;
  const userId = await requireAuthenticatedUser(req, res);
  if (!userId) return;

  if (req.method === "POST") {
    let solutionId;
    try {
      const body = parseJsonBody(req.body);
      if (Object.keys(body).some((key) => key !== "solutionId")) {
        throw new Error("Only a solution ID can be used to start a conversation.");
      }
      if (typeof body.solutionId !== "string" || !mongoose.isObjectIdOrHexString(body.solutionId)) {
        throw new Error("A valid solution ID is required.");
      }
      solutionId = body.solutionId;
    } catch (error) {
      return sendJson(res, 400, { error: error.message });
    }

    try {
      await connectToDatabase();
      const solution = await Solution.findOne({
        _id: solutionId,
        status: "APPROVED",
      }).select("problem author status").lean();
      if (!solution) {
        return sendJson(res, 403, { error: "Private chat requires an approved solution." });
      }

      const problem = await Problem.findById(solution.problem).select("author").lean();
      if (!problem) return sendJson(res, 404, { error: "Problem not found." });
      const problemAuthorId = problem.author.toString();
      const solutionProviderId = solution.author.toString();
      if (userId !== problemAuthorId && userId !== solutionProviderId) {
        return sendJson(res, 403, { error: "You are not a participant in this conversation." });
      }

      let conversation;
      try {
        conversation = await Conversation.findOneAndUpdate(
          { solution: solution._id },
          {
            $setOnInsert: {
              problem: solution.problem,
              solution: solution._id,
              problemAuthor: problem.author,
              solutionProvider: solution.author,
            },
          },
          { upsert: true, new: true, runValidators: true },
        );
      } catch (error) {
        if (error.code !== 11000) throw error;
        conversation = await Conversation.findOne({ solution: solution._id });
      }

      if (!conversation) {
        return sendJson(res, 500, { error: "Could not open this conversation." });
      }
      return sendJson(res, 200, { conversationId: conversation._id.toString() });
    } catch (error) {
      return handleApiError(res, error, "Start conversation");
    }
  }

  try {
    await connectToDatabase();
    const records = await Conversation.find({
      $or: [{ problemAuthor: userId }, { solutionProvider: userId }],
    })
      .populate({ path: "problem", select: "title subject" })
      .populate({ path: "solution", select: "status" })
      .populate({ path: "problemAuthor", select: conversationParticipantFields })
      .populate({ path: "solutionProvider", select: conversationParticipantFields })
      .sort({ updatedAt: -1 })
      .limit(50)
      .lean();

    const approved = records.filter((conversation) =>
      conversation.solution?.status === "APPROVED" && conversation.problem,
    );
    const unreadCounts = approved.length
      ? await Message.aggregate([
          {
            $match: {
              conversation: {
                $in: approved.map((conversation) => conversation._id),
              },
              sender: { $ne: new mongoose.Types.ObjectId(userId) },
              readBy: { $nin: [new mongoose.Types.ObjectId(userId)] },
            },
          },
          { $group: { _id: "$conversation", count: { $sum: 1 } } },
        ])
      : [];
    const unreadByConversation = new Map(
      unreadCounts.map((entry) => [entry._id.toString(), entry.count]),
    );
    const result = approved.map((conversation) => serializeConversation(
      conversation,
      userId,
      unreadByConversation.get(conversation._id.toString()) ?? 0,
    ));
    return sendJson(res, 200, {
      conversations: result,
      unreadCount: result.reduce((total, conversation) => (
        total + conversation.unreadCount
      ), 0),
    });
  } catch (error) {
    return handleApiError(res, error, "Conversation list");
  }
}
