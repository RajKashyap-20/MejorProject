import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import Notification from "../models/Notification.js";
import Problem from "../models/Problem.js";
import Reaction from "../models/Reaction.js";
import Solution from "../models/Solution.js";

export async function deleteProblemAndRelatedData(filter) {
  const problem = await Problem.findOneAndDelete(filter).select("_id").lean();
  if (!problem) return false;

  const solutions = await Solution.find({ problem: problem._id }).select("_id").lean();
  const solutionIds = solutions.map((solution) => solution._id);
  const conversations = await Conversation.find({
    $or: [
      { problem: problem._id },
      { solution: { $in: solutionIds } },
    ],
  }).select("_id").lean();
  const conversationIds = conversations.map((conversation) => conversation._id);

  await Promise.all([
    Message.deleteMany({ conversation: { $in: conversationIds } }),
    Conversation.deleteMany({ _id: { $in: conversationIds } }),
    Solution.deleteMany({ problem: problem._id }),
    Reaction.deleteMany({ problem: problem._id }),
    Notification.deleteMany({
      $or: [
        { relatedProblemId: problem._id },
        { relatedSolutionId: { $in: solutionIds } },
        { relatedConversationId: { $in: conversationIds } },
      ],
    }),
  ]);
  return true;
}
