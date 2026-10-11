import { getOptionalAuthenticatedUser, requireAuthenticatedUser } from "../../server/auth.js";
import { connectToDatabase } from "../../server/db.js";
import { allowMethods, handleApiError, parseJsonBody, sendJson } from "../../server/http.js";
import { serializeProblem, publicAuthorFields } from "../../server/problem.js";
import { getProblemReactions } from "../../server/reactions.js";
import {
  escapeRegex,
  readSingleQueryValue,
  validateProblemInput,
} from "../../server/problem-validation.js";
import { PROBLEM_SUBJECTS } from "../../models/Problem.js";
import Problem from "../../models/Problem.js";

const PAGE_SIZE = 12;
const MAX_PAGE = 100000;

function readListFilters(query) {
  let page = 1;
  let search = "";
  let subject = "";

  try {
    if (query.page !== undefined) {
      const value = readSingleQueryValue(query.page, "Page");
      if (!/^\d+$/.test(value)) throw new Error("Page must be a positive whole number.");
      page = Number(value);
      if (!Number.isSafeInteger(page) || page < 1 || page > MAX_PAGE) {
        throw new Error("Page must be between 1 and 100,000.");
      }
    }
    if (query.search !== undefined) {
      search = readSingleQueryValue(query.search, "Search").trim();
      if (search.length > 120) throw new Error("Search must be 120 characters or fewer.");
    }
    if (query.subject !== undefined) {
      subject = readSingleQueryValue(query.subject, "Subject");
      if (subject && !PROBLEM_SUBJECTS.includes(subject)) {
        throw new Error("Choose a valid subject filter.");
      }
    }
  } catch (error) {
    error.statusCode = 400;
    throw error;
  }

  return { page, search, subject };
}

export default async function problems(req, res) {
  if (!allowMethods(req, res, ["GET", "POST"])) return;

  if (req.method === "POST") {
    const authorId = await requireAuthenticatedUser(req, res);
    if (!authorId) return;

    let problemData;
    try {
      problemData = validateProblemInput(parseJsonBody(req.body));
    } catch (error) {
      return sendJson(res, 400, { error: error.message });
    }

    try {
      await connectToDatabase();
      const problem = await Problem.create({ ...problemData, author: authorId });
      await problem.populate({ path: "author", select: publicAuthorFields });
      return sendJson(res, 201, { problem: serializeProblem(problem) });
    } catch (error) {
      return handleApiError(res, error, "Problem creation");
    }
  }

  let filters;
  try {
    filters = readListFilters(req.query || {});
  } catch (error) {
    return sendJson(res, error.statusCode || 400, { error: error.message });
  }

  try {
    await connectToDatabase();
    const databaseFilter = {};
    if (filters.subject) databaseFilter.subject = filters.subject;
    if (filters.search) {
      const searchPattern = new RegExp(escapeRegex(filters.search), "i");
      databaseFilter.$or = [
        { title: searchPattern },
        { description: searchPattern },
        { category: searchPattern },
      ];
    }

    const [total, records] = await Promise.all([
      Problem.countDocuments(databaseFilter),
      Problem.find(databaseFilter)
        .select("title description subject category imageUrl status author createdAt updatedAt")
        .populate({ path: "author", select: publicAuthorFields })
        .sort({ createdAt: -1, _id: -1 })
        .skip((filters.page - 1) * PAGE_SIZE)
        .limit(PAGE_SIZE)
        .lean(),
    ]);

    const viewerId = getOptionalAuthenticatedUser(req);
    const reactions = await getProblemReactions(records, viewerId);
    const serializedProblems = records.map((problem) =>
      serializeProblem(problem, reactions.get(problem._id.toString())),
    );

    return sendJson(res, 200, {
      problems: serializedProblems,
      pagination: {
        page: filters.page,
        pageSize: PAGE_SIZE,
        total,
        totalPages: Math.ceil(total / PAGE_SIZE),
      },
      viewerId,
    });
  } catch (error) {
    return handleApiError(res, error, "Problem feed");
  }
}
