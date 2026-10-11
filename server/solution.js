export const publicSolutionAuthorFields = "name profilePictureUrl";

export function serializeSolution(solution) {
  return {
    id: solution._id.toString(),
    problemId: solution.problem?._id
      ? solution.problem._id.toString()
      : solution.problem?.toString() ?? "",
    content: solution.content,
    imageUrl: solution.imageUrl || "",
    status: solution.status,
    createdAt: solution.createdAt,
    updatedAt: solution.updatedAt,
    author: solution.author
      ? {
          id: solution.author._id.toString(),
          name: solution.author.name,
          profilePictureUrl: solution.author.profilePictureUrl || "",
        }
      : null,
  };
}

export function serializeSolutions(solutions) {
  return solutions.map(serializeSolution);
}

export function canReviewSolution(problemAuthorId, currentUserId) {
  return problemAuthorId?.toString() === currentUserId;
}

export function isPendingSolution(status) {
  return status === "WAITING";
}
