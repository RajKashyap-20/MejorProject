import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";
import Solution from "../models/Solution.js";

export function isConversationAccessAllowed(conversation, solution, userId) {
  if (!conversation || !solution || !userId) return false;

  const member =
    conversation.problemAuthor.toString() === userId ||
    conversation.solutionProvider.toString() === userId;
  return (
    member &&
    solution._id.toString() === conversation.solution.toString() &&
    solution.problem.toString() === conversation.problem.toString() &&
    solution.author.toString() === conversation.solutionProvider.toString() &&
    solution.status === "APPROVED"
  );
}

export function isValidConversationId(value) {
  return typeof value === "string" && mongoose.isObjectIdOrHexString(value);
}

export async function findAccessibleConversation(conversationId, userId) {
  const conversation = await Conversation.findOne({
    _id: conversationId,
    $or: [{ problemAuthor: userId }, { solutionProvider: userId }],
  }).lean();
  if (!conversation) return null;

  const solution = await Solution.findOne({
    _id: conversation.solution,
    problem: conversation.problem,
    author: conversation.solutionProvider,
    status: "APPROVED",
  }).select("_id").lean();

  return isConversationAccessAllowed(conversation, solution, userId)
    ? conversation
    : null;
}
