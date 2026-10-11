import mongoose from "mongoose";
import { requireAuthenticatedUser } from "../../../server/auth.js";
import { connectToDatabase } from "../../../server/db.js";
import { handleApiError, allowMethods, parseJsonBody, sendJson } from "../../../server/http.js";
import { createNotification } from "../../../server/notifications.js";
import {
  canReviewSolution,
  isPendingSolution,
  serializeSolution,
  publicSolutionAuthorFields,
} from "../../../server/solution.js";
import Conversation from "../../../models/Conversation.js";
import Problem from "../../../models/Problem.js";
import Solution from "../../../models/Solution.js";

export default async function solutionDecision(req, res) {
  if (!allowMethods(req, res, ["PATCH"])) return;
  const authorId = await requireAuthenticatedUser(req, res);
  if (!authorId) return;

  const solutionId = req.query?.solutionId;
  if (typeof solutionId !== "string" || !mongoose.isObjectIdOrHexString(solutionId)) {
    return sendJson(res, 400, { error: "A valid solution ID is required." });
  }

  let status;
  try {
    const body = parseJsonBody(req.body);
    if (Object.keys(body).some((key) => key !== "status")) {
      throw new Error("Only the solution status can be changed here.");
    }
    if (body.status !== "APPROVED" && body.status !== "REJECTED") {
      throw new Error("Choose APPROVED or REJECTED.");
    }
    status = body.status;
  } catch (error) {
    return sendJson(res, 400, { error: error.message });
  }

  try {
    await connectToDatabase();
    const solution = await Solution.findById(solutionId)
      .select("problem author status")
      .lean();
    if (!solution) return sendJson(res, 404, { error: "Solution not found." });

    const problem = await Problem.findById(solution.problem).select("author").lean();
    if (!problem) return sendJson(res, 404, { error: "Problem not found." });
    if (!canReviewSolution(problem.author, authorId)) {
      return sendJson(res, 403, { error: "Only the problem author can review solutions." });
    }
    if (!isPendingSolution(solution.status)) {
      return sendJson(res, 409, { error: "This solution has already been reviewed." });
    }

    const updated = await Solution.findOneAndUpdate(
      { _id: solutionId, status: "WAITING" },
      { $set: { status } },
      { new: true, runValidators: true },
    )
      .select("problem author content imageUrl status createdAt updatedAt")
      .populate({ path: "author", select: publicSolutionAuthorFields })
      .lean();
    if (!updated) {
      return sendJson(res, 409, { error: "This solution has already been reviewed." });
    }

    if (status === "APPROVED") {
      await Conversation.updateOne(
        { solution: updated._id },
        {
          $setOnInsert: {
            problem: updated.problem,
            solution: updated._id,
            problemAuthor: authorId,
            solutionProvider: updated.author._id,
          },
        },
        { upsert: true, runValidators: true },
      );
    }

    await createNotification({
      recipientId: updated.author._id,
      actorId: authorId,
      type: status === "APPROVED" ? "SOLUTION_APPROVED" : "SOLUTION_REJECTED",
      message: status === "APPROVED"
        ? "Your solution was approved. Private chat is now available."
        : "Your solution was not approved.",
      relatedProblemId: updated.problem,
      relatedSolutionId: updated._id,
    });

    return sendJson(res, 200, { solution: serializeSolution(updated) });
  } catch (error) {
    return handleApiError(res, error, "Solution decision");
  }
}
