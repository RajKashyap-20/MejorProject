import mongoose from "mongoose";
import Conversation from "./Conversation.js";
import User from "./User.js";

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: Conversation.modelName,
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: User.modelName,
      required: true,
    },
    text: {
      type: String,
      default: "",
      trim: true,
      maxlength: 5000,
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
        message: "Message image URL must use HTTP or HTTPS.",
      },
    },
    imagePublicId: {
      type: String,
      default: "",
      maxlength: 255,
    },
    readBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: User.modelName,
    }],
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

messageSchema.index({ conversation: 1, createdAt: -1 });

const Message = mongoose.models.Message || mongoose.model("Message", messageSchema);

export default Message;
