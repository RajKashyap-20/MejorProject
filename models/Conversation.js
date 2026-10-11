import mongoose from "mongoose";
import Problem from "./Problem.js";
import Solution from "./Solution.js";
import User from "./User.js";

const conversationSchema = new mongoose.Schema(
  {
    problem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: Problem.modelName,
      required: true,
      index: true,
    },
    solution: {
      type: mongoose.Schema.Types.ObjectId,
      ref: Solution.modelName,
      required: true,
      unique: true,
    },
    problemAuthor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: User.modelName,
      required: true,
      index: true,
    },
    solutionProvider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: User.modelName,
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

conversationSchema.index({ problemAuthor: 1, updatedAt: -1 });
conversationSchema.index({ solutionProvider: 1, updatedAt: -1 });

const Conversation =
  mongoose.models.Conversation ||
  mongoose.model("Conversation", conversationSchema);

export default Conversation;
