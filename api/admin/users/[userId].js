import mongoose from "mongoose";
import { requireAdminUser } from "../../../server/admin.js";
import { canSuspendUser, validateSuspensionRequest } from "../../../server/admin-user.js";
import { connectToDatabase } from "../../../server/db.js";
import { handleApiError, allowMethods, parseJsonBody, sendJson } from "../../../server/http.js";
import User from "../../../models/User.js";

export default async function updateUserSuspension(req, res) {
  if (!allowMethods(req, res, ["PATCH"])) return;
  try {
    const adminId = await requireAdminUser(req, res);
    if (!adminId) return;

    const userId = req.query?.userId;
    if (typeof userId !== "string" || !mongoose.isObjectIdOrHexString(userId)) {
      return sendJson(res, 400, { error: "A valid user ID is required." });
    }

    let suspended;
    try {
      suspended = validateSuspensionRequest(parseJsonBody(req.body));
    } catch (error) {
      return sendJson(res, 400, { error: error.message });
    }

    await connectToDatabase();
    const target = await User.findById(userId).select("+role +isSuspended").lean();
    if (!target) return sendJson(res, 404, { error: "User not found." });
    if (!canSuspendUser(adminId, userId, target.role || "USER")) {
      return sendJson(res, 403, { error: "You cannot suspend yourself or another administrator." });
    }

    const updated = await User.findOneAndUpdate(
      { _id: userId, role: "USER" },
      { $set: { isSuspended: suspended } },
      { new: true, runValidators: true },
    ).select("+isSuspended").lean();
    if (!updated) return sendJson(res, 409, { error: "This account changed while you were updating it." });
    return sendJson(res, 200, {
      user: { id: updated._id.toString(), isSuspended: updated.isSuspended },
    });
  } catch (error) {
    return handleApiError(res, error, "Admin user update");
  }
}
