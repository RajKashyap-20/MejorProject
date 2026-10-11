import { requireAdminUser } from "../../server/admin.js";
import { handleApiError, allowMethods, sendJson } from "../../server/http.js";
import { serializeProblem, publicAuthorFields } from "../../server/problem.js";
import Problem from "../../models/Problem.js";

const PAGE_SIZE = 25;

export default async function adminProblems(req, res) {
  if (!allowMethods(req, res, ["GET"])) return;
  try {
    const adminId = await requireAdminUser(req, res);
    if (!adminId) return;
    const pageValue = req.query?.page === undefined ? "1" : req.query.page;
    if (
      typeof pageValue !== "string" ||
      !/^\d+$/.test(pageValue) ||
      Number(pageValue) < 1 ||
      Number(pageValue) > 100000
    ) {
      return sendJson(res, 400, { error: "Page must be between 1 and 100,000." });
    }
    const page = Number(pageValue);
    const [total, records] = await Promise.all([
      Problem.countDocuments(),
      Problem.find()
        .select("title description subject category imageUrl status author createdAt updatedAt")
        .populate({ path: "author", select: publicAuthorFields })
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * PAGE_SIZE)
        .limit(PAGE_SIZE)
        .lean(),
    ]);
    return sendJson(res, 200, {
      problems: records.map((problem) => serializeProblem(problem)),
      pagination: { page, pageSize: PAGE_SIZE, total, totalPages: Math.ceil(total / PAGE_SIZE) },
    });
  } catch (error) {
    return handleApiError(res, error, "Admin problems");
  }
}
