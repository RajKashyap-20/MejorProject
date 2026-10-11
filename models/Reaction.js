import mongoose from "mongoose";
import Problem from "./Problem.js";
import User from "./User.js";

const reactionSchema = new mongoose.Schema(
  {
    problem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: Problem.modelName,
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: User.modelName,
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

reactionSchema.index({ problem: 1, user: 1 }, { unique: true });

const Reaction = mongoose.models.Reaction || mongoose.model("Reaction", reactionSchema);

export default Reaction;
