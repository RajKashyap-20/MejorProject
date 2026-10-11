import mongoose from "mongoose";
import Problem from "./Problem.js";
import User from "./User.js";

export const SOLUTION_STATUSES = ["WAITING", "APPROVED", "REJECTED"];

const solutionSchema = new mongoose.Schema(
  {
    problem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: Problem.modelName,
      required: true,
      index: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: User.modelName,
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 10000,
    },
    imageUrl: {
      type: String,
      default: "",
      maxlength: 2048,
      validate: {
        validator(value) {
          if (!value) return true;
          try {
            return ["http:", "https:"].includes(new URL(value).protocol);
          } catch {
            return false;
          }
        },
        message: "Solution image URL must use HTTP or HTTPS.",
      },
    },
    status: {
      type: String,
      enum: SOLUTION_STATUSES,
      default: "WAITING",
      index: true,
    },
  },
  { timestamps: true },
);

solutionSchema.index({ author: 1, status: 1, createdAt: -1 });

const Solution =
  mongoose.models.Solution || mongoose.model("Solution", solutionSchema);

export default Solution;
