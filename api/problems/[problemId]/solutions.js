import mongoose from "mongoose";
import { requireAuthenticatedUser } from "../../../server/auth.js";
import { connectToDatabase } from "../../../server/db.js";
import { handleApiError, allowMethods, parseJsonBody, sendJson } from "../../../server/http.js";
import { publicSolutionAuthorFields, serializeSolutions, serializeSolution } from "../../../server/solution.js";
import { createNotification } from "../../../server/notifications.js";
import { validateSolutionInput } from "../../../server/solution-validation.js";
import Problem from "../../../models/Problem.js";
import Solution from "../../../models/Solution.js";

export default async function problemSolutions(req, res) {
  if (!allowMethods(req, res, ["GET", "POST"])) return;
  const problemId = req.query?.problemId;
  if (typeof problemId !== "string" || !mongoose.isObjectIdOrHexString(problemId)) {
    return sendJson(res, 400, { error: "A valid problem ID is required." });
  }

  let authorId = null;
  let values = null;
  if (req.method === "POST") {
    authorId = await requireAuthenticatedUser(req, res);
    if (!authorId) return;
    try {
      values = validateSolutionInput(parseJsonBody(req.body));
    } catch (error) {
      return sendJson(res, 400, { error: error.message });
    }
  }

  try {
    await connectToDatabase();
    const problem = await Problem.findById(problemId).select("status author").lean();
    if (!problem) return sendJson(res, 404, { error: "Problem not found." });

    if (req.method === "GET") {
      const solutions = await Solution.find({ problem: problemId })
        .select("problem author content imageUrl status createdAt updatedAt")
        .populate({ path: "author", select: publicSolutionAuthorFields })
        .sort({ createdAt: 1, _id: 1 })
        .lean();
      return sendJson(res, 200, { solutions: serializeSolutions(solutions) });
    }

    if (problem.status !== "OPEN") {
      return sendJson(res, 409, { error: "This problem is closed to new solutions." });
    }
    const solution = await Solution.create({
      ...values,
      problem: problemId,
      author: authorId,
    });
    await createNotification({
      recipientId: problem.author,
      actorId: authorId,
      type: "SOLUTION_SUBMITTED",
      message: "A student shared a solution to your problem.",
      relatedProblemId: problemId,
      relatedSolutionId: solution._id,
    });
    await solution.populate({ path: "author", select: publicSolutionAuthorFields });
    return sendJson(res, 201, { solution: serializeSolution(solution) });
  } catch (error) {
    return handleApiError(res, error, "Problem solutions");
  }
}
