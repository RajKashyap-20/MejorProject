import mongoose from "mongoose";
import User from "./User.js";

export const PROBLEM_SUBJECTS = [
  "Java",
  "DSA",
  "Web Development",
  "DBMS",
  "Operating Systems",
  "Computer Networks",
  "Mathematics",
  "Other",
];

export const PROBLEM_STATUSES = ["OPEN", "CLOSED"];

const problemSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: User.modelName,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 10000,
    },
    subject: {
      type: String,
      required: true,
      enum: PROBLEM_SUBJECTS,
      trim: true,
    },
    category: {
      type: String,
      default: "",
      trim: true,
      maxlength: 80,
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
        message: "Problem image URL must use HTTP or HTTPS.",
      },
    },
    status: {
      type: String,
      enum: PROBLEM_STATUSES,
      default: "OPEN",
      index: true,
    },
  },
  { timestamps: true },
);

problemSchema.index({ createdAt: -1 });
problemSchema.index({ subject: 1, createdAt: -1 });
problemSchema.index({ author: 1, createdAt: -1 });

const Problem = mongoose.models.Problem || mongoose.model("Problem", problemSchema);

export default Problem;
