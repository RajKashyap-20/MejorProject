import Reaction from "../models/Reaction.js";

export async function getProblemReactions(problems, viewerId = null) {
  if (!problems.length) return new Map();

  const problemIds = problems.map((problem) => problem._id);
  const [counts, viewerReactions] = await Promise.all([
    Reaction.aggregate([
      { $match: { problem: { $in: problemIds } } },
      { $group: { _id: "$problem", count: { $sum: 1 } } },
    ]),
    viewerId
      ? Reaction.find({ problem: { $in: problemIds }, user: viewerId })
          .select("problem")
          .lean()
      : [],
  ]);

  const countByProblem = new Map(
    counts.map((entry) => [entry._id.toString(), entry.count]),
  );
  const reactedByViewer = new Set(
    viewerReactions.map((reaction) => reaction.problem.toString()),
  );

  return new Map(
    problems.map((problem) => {
      const id = problem._id.toString();
      return [
        id,
        {
          count: countByProblem.get(id) ?? 0,
          reacted: reactedByViewer.has(id),
        },
      ];
    }),
  );
}

export async function getSingleProblemReaction(problemId, viewerId = null) {
  const [count, reacted] = await Promise.all([
    Reaction.countDocuments({ problem: problemId }),
    viewerId ? Reaction.exists({ problem: problemId, user: viewerId }) : null,
  ]);
  return { count, reacted: Boolean(reacted) };
}
