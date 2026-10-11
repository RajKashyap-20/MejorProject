import { connectToDatabase } from "../../server/db.js";
import { handleApiError, allowMethods, sendJson } from "../../server/http.js";
import { getProfileData, isValidProfileId } from "../../server/profile.js";

export default async function profileById(req, res) {
  if (!allowMethods(req, res, ["GET"])) return;

  const { userId } = req.query;
  if (!isValidProfileId(userId)) {
    return sendJson(res, 400, { error: "A valid profile ID is required." });
  }

  try {
    await connectToDatabase();
    const data = await getProfileData(userId);
    if (!data) return sendJson(res, 404, { error: "Profile not found." });
    return sendJson(res, 200, data);
  } catch (error) {
    return handleApiError(res, error, "Public profile lookup");
  }
}
