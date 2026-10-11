import mongoose from "mongoose";
import { requireAuthenticatedUser } from "../../../server/auth.js";
import { connectToDatabase } from "../../../server/db.js";
import { handleApiError, allowMethods, sendJson } from "../../../server/http.js";
import { createNotification } from "../../../server/notifications.js";
import Problem from "../../../models/Problem.js";
import Reaction from "../../../models/Reaction.js";

export default async function problemReaction(req, res) {
  if (!allowMethods(req, res, ["POST", "DELETE"])) return;

  const userId = await requireAuthenticatedUser(req, res);
  if (!userId) return;

  const problemId = req.query?.problemId;
  if (typeof problemId !== "string" || !mongoose.isObjectIdOrHexString(problemId)) {
    return sendJson(res, 400, { error: "A valid problem ID is required." });
  }

  try {
    await connectToDatabase();
    const problem = await Problem.findById(problemId).select("author").lean();
    if (!problem) return sendJson(res, 404, { error: "Problem not found." });

    if (req.method === "POST") {
      let created = false;
      try {
        const result = await Reaction.updateOne(
          { problem: problemId, user: userId },
          { $setOnInsert: { problem: problemId, user: userId } },
          { upsert: true, runValidators: true },
        );
        created = Boolean(result.upsertedCount);
      } catch (error) {
        if (error.code !== 11000) throw error;
      }
      if (created) {
        await createNotification({
          recipientId: problem.author,
          actorId: userId,
          type: "PROBLEM_REACTION",
          message: "A student marked your problem as helpful.",
          relatedProblemId: problemId,
        });
      }
    } else {
      await Reaction.deleteOne({ problem: problemId, user: userId });
    }

    const [count, reacted] = await Promise.all([
      Reaction.countDocuments({ problem: problemId }),
      Reaction.exists({ problem: problemId, user: userId }),
    ]);

    return sendJson(res, 200, { count, reacted: Boolean(reacted) });
  } catch (error) {
    return handleApiError(res, error, "Problem reaction");
  }
}
