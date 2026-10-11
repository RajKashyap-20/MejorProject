import { requireAuthenticatedUser } from "./auth.js";
import { connectToDatabase } from "./db.js";
import { sendJson } from "./http.js";
import User from "../models/User.js";

export function hasAdminRole(user) {
  return user?.role === "ADMIN";
}

export async function requireAdminUser(req, res) {
  const userId = await requireAuthenticatedUser(req, res);
  if (!userId) return null;

  await connectToDatabase();
  const user = await User.findById(userId).select("+role").lean();
  if (!user) {
    sendJson(res, 401, { error: "Please sign in to continue." });
    return null;
  }
  if (!hasAdminRole(user)) {
    sendJson(res, 403, { error: "Administrator access is required." });
    return null;
  }
  return userId;
}
