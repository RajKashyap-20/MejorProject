import mongoose from "mongoose";
import { requireAdminUser } from "../../../server/admin.js";
import { deleteProblemAndRelatedData } from "../../../server/delete-problem.js";
import { handleApiError, allowMethods, sendJson } from "../../../server/http.js";

export default async function removeProblem(req, res) {
  if (!allowMethods(req, res, ["DELETE"])) return;
  try {
    const adminId = await requireAdminUser(req, res);
    if (!adminId) return;
    const problemId = req.query?.problemId;
    if (typeof problemId !== "string" || !mongoose.isObjectIdOrHexString(problemId)) {
      return sendJson(res, 400, { error: "A valid problem ID is required." });
    }
    const deleted = await deleteProblemAndRelatedData({ _id: problemId });
    if (!deleted) return sendJson(res, 404, { error: "Problem not found." });
    return sendJson(res, 200, { message: "Problem and related content removed." });
  } catch (error) {
    return handleApiError(res, error, "Admin problem removal");
  }
}
