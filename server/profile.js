import mongoose from "mongoose";
import Problem from "../models/Problem.js";
import Solution from "../models/Solution.js";
import User from "../models/User.js";

export const publicProfileFields =
  "name profilePictureUrl college bio subjects createdAt";

export function serializeProfile(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    profilePictureUrl: user.profilePictureUrl || "",
    college: user.college || "",
    bio: user.bio || "",
    subjects: user.subjects || [],
    createdAt: user.createdAt,
  };
}

export async function getProfileData(userId) {
  const user = await User.findById(userId).select(publicProfileFields).lean();
  if (!user) return null;

  const [problems, approvedSolutions] = await Promise.all([
    Problem.find({ author: userId })
      .select("title description subject createdAt")
      .sort({ createdAt: -1 })
      .lean(),
    Solution.find({ author: userId, status: "APPROVED" })
      .select("content problem createdAt")
      .populate({ path: "problem", select: "title" })
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  return {
    profile: serializeProfile(user),
    problems: problems.map((problem) => ({
      id: problem._id.toString(),
      title: problem.title,
      description: problem.description,
      subject: problem.subject || "",
      createdAt: problem.createdAt,
    })),
    approvedSolutions: approvedSolutions.map((solution) => ({
      id: solution._id.toString(),
      content: solution.content,
      problem: solution.problem
        ? { title: solution.problem.title }
        : null,
      createdAt: solution.createdAt,
    })),
  };
}

export function isValidProfileId(value) {
  return typeof value === "string" && mongoose.isObjectIdOrHexString(value);
}
