import mongoose from "mongoose";
import { getOptionalAuthenticatedUser, requireAuthenticatedUser } from "../../server/auth.js";
import { connectToDatabase } from "../../server/db.js";
import { allowMethods, handleApiError, parseJsonBody, sendJson } from "../../server/http.js";
import { serializeProblem, publicAuthorFields } from "../../server/problem.js";
import { getSingleProblemReaction } from "../../server/reactions.js";
import { validateProblemInput } from "../../server/problem-validation.js";
import Problem from "../../models/Problem.js";
import { deleteProblemAndRelatedData } from "../../server/delete-problem.js";

function validateId(value) {
  return typeof value === "string" && mongoose.isObjectIdOrHexString(value);
}

export default async function problemById(req, res) {
  if (!allowMethods(req, res, ["GET", "PATCH", "DELETE"])) return;
  const problemId = req.query?.problemId;
  if (!validateId(problemId)) {
    return sendJson(res, 400, { error: "A valid problem ID is required." });
  }

  let authorId = null;
  if (req.method !== "GET") {
    authorId = await requireAuthenticatedUser(req, res);
    if (!authorId) return;
  }

  let update;
  if (req.method === "PATCH") {
    try {
      update = validateProblemInput(parseJsonBody(req.body), { partial: true });
    } catch (error) {
      return sendJson(res, 400, { error: error.message });
    }
  }

  try {
    await connectToDatabase();

    if (req.method === "GET") {
      const problem = await Problem.findById(problemId)
        .select("title description subject category imageUrl status author createdAt updatedAt")
        .populate({ path: "author", select: publicAuthorFields })
        .lean();
      if (!problem) return sendJson(res, 404, { error: "Problem not found." });
      const viewerId = getOptionalAuthenticatedUser(req);
      const reaction = await getSingleProblemReaction(problemId, viewerId);
      return sendJson(res, 200, {
        problem: serializeProblem(problem, reaction),
        viewerId,
      });
    }

    const problem = await Problem.findById(problemId).select("author");
    if (!problem) return sendJson(res, 404, { error: "Problem not found." });
    if (problem.author.toString() !== authorId) {
      return sendJson(res, 403, { error: "Only the problem author can change this post." });
    }

    if (req.method === "DELETE") {
      const deleted = await deleteProblemAndRelatedData({
        _id: problemId,
        author: authorId,
      });
      if (!deleted) return sendJson(res, 404, { error: "Problem not found." });
      return sendJson(res, 200, { message: "Problem deleted." });
    }

    const updatedProblem = await Problem.findOneAndUpdate(
      { _id: problemId, author: authorId },
      { $set: update },
      { new: true, runValidators: true },
    )
      .select("title description subject category imageUrl status author createdAt updatedAt")
      .populate({ path: "author", select: publicAuthorFields })
      .lean();

    if (!updatedProblem) return sendJson(res, 404, { error: "Problem not found." });
    return sendJson(res, 200, { problem: serializeProblem(updatedProblem) });
  } catch (error) {
    return handleApiError(res, error, "Problem detail");
  }
}
