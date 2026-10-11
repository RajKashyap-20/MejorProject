import mongoose from "mongoose";
import Problem from "./Problem.js";
import Solution from "./Solution.js";
import Conversation from "./Conversation.js";
import User from "./User.js";

export const NOTIFICATION_TYPES = [
  "SOLUTION_SUBMITTED",
  "SOLUTION_APPROVED",
  "SOLUTION_REJECTED",
  "CHAT_MESSAGE",
  "PROBLEM_REACTION",
];

const notificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: User.modelName,
      required: true,
      index: true,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: User.modelName,
      default: null,
    },
    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    relatedProblemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: Problem.modelName,
      default: null,
    },
    relatedSolutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: Solution.modelName,
      default: null,
    },
    relatedConversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: Conversation.modelName,
      default: null,
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

notificationSchema.index({ recipientId: 1, read: 1, createdAt: -1 });

const Notification =
  mongoose.models.Notification ||
  mongoose.model("Notification", notificationSchema);

export default Notification;
