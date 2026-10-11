import { requireAdminUser } from "../../server/admin.js";
import { handleApiError, allowMethods, sendJson } from "../../server/http.js";
import { escapeRegex, readSingleQueryValue } from "../../server/problem-validation.js";
import User from "../../models/User.js";

const PAGE_SIZE = 25;

export default async function adminUsers(req, res) {
  if (!allowMethods(req, res, ["GET"])) return;
  try {
    const adminId = await requireAdminUser(req, res);
    if (!adminId) return;
    const pageValue = req.query?.page === undefined
      ? "1"
      : readSingleQueryValue(req.query.page, "Page");
    if (!/^\d+$/.test(pageValue) || Number(pageValue) < 1 || Number(pageValue) > 100000) {
      return sendJson(res, 400, { error: "Page must be between 1 and 100,000." });
    }
    const page = Number(pageValue);
    const search = req.query?.search === undefined
      ? ""
      : readSingleQueryValue(req.query.search, "Search").trim();
    if (search.length > 120) {
      return sendJson(res, 400, { error: "Search must be 120 characters or fewer." });
    }

    const filter = search
      ? { $or: [
          { name: new RegExp(escapeRegex(search), "i") },
          { email: new RegExp(escapeRegex(search), "i") },
        ] }
      : {};
    const [total, users] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .select("name profilePictureUrl createdAt +email +role +isSuspended")
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * PAGE_SIZE)
        .limit(PAGE_SIZE)
        .lean(),
    ]);
    return sendJson(res, 200, {
      users: users.map((user) => ({
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        profilePictureUrl: user.profilePictureUrl || "",
        role: user.role || "USER",
        isSuspended: Boolean(user.isSuspended),
        createdAt: user.createdAt,
      })),
      pagination: { page, pageSize: PAGE_SIZE, total, totalPages: Math.ceil(total / PAGE_SIZE) },
    });
  } catch (error) {
    return handleApiError(res, error, "Admin users");
  }
}
