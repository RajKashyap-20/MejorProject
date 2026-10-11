import { requireAuthenticatedUser } from "../../server/auth.js";
import { connectToDatabase } from "../../server/db.js";
import { handleApiError, allowMethods, sendJson } from "../../server/http.js";
import User from "../../models/User.js";

export default async function currentUser(req, res) {
  if (!allowMethods(req, res, ["GET"])) return;
  const userId = await requireAuthenticatedUser(req, res);
  if (!userId) return;

  try {
    await connectToDatabase();
    const user = await User.findById(userId)
      .select("name email profilePictureUrl college subjects +role")
      .lean();
    if (!user) return sendJson(res, 401, { error: "Please sign in to continue." });
    return sendJson(res, 200, {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        profilePictureUrl: user.profilePictureUrl || "",
        college: user.college || "",
        subjects: user.subjects || [],
        role: user.role || "USER",
      },
    });
  } catch (error) {
    return handleApiError(res, error, "Current user");
  }
}
