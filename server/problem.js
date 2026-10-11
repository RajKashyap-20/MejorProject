export const publicAuthorFields = "name profilePictureUrl";

export function serializeProblem(problem, reaction = { count: 0, reacted: false }) {
  const author = problem.author;
  return {
    id: problem._id.toString(),
    title: problem.title,
    description: problem.description,
    subject: problem.subject,
    category: problem.category || "",
    imageUrl: problem.imageUrl || "",
    status: problem.status || "OPEN",
    reactionCount: reaction.count,
    viewerReacted: reaction.reacted,
    createdAt: problem.createdAt,
    updatedAt: problem.updatedAt,
    author: author
      ? {
          id: author._id.toString(),
          name: author.name,
          profilePictureUrl: author.profilePictureUrl || "",
        }
      : { id: problem.author.toString(), name: "AcadLink student", profilePictureUrl: "" },
  };
}

export function serializeProblemList(problems) {
  return problems.map(serializeProblem);
}
