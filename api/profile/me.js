import { requireAuthenticatedUser } from "../../server/auth.js";
import { connectToDatabase } from "../../server/db.js";
import { getProfileData, publicProfileFields, serializeProfile } from "../../server/profile.js";
import { handleApiError, allowMethods, parseJsonBody, sendJson } from "../../server/http.js";
import { validateProfileUpdate } from "../../server/profile-validation.js";
import User from "../../models/User.js";

export default async function myProfile(req, res) {
  if (!allowMethods(req, res, ["GET", "PATCH"])) return;
  const userId = await requireAuthenticatedUser(req, res);
  if (!userId) return;

  try {
    let update;
    if (req.method === "PATCH") {
      try {
        update = validateProfileUpdate(parseJsonBody(req.body));
      } catch (error) {
        return sendJson(res, 400, { error: error.message });
      }
    }

    await connectToDatabase();

    if (req.method === "GET") {
      const data = await getProfileData(userId);
      if (!data) return sendJson(res, 404, { error: "Profile not found." });
      return sendJson(res, 200, data);
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: update },
      { new: true, runValidators: true, select: publicProfileFields },
    ).lean();

    if (!user) return sendJson(res, 404, { error: "Profile not found." });
    return sendJson(res, 200, { profile: serializeProfile(user) });
  } catch (error) {
    return handleApiError(res, error, "Own profile");
  }
}
