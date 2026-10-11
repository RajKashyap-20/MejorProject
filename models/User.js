import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      select: false,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ["USER", "ADMIN"],
      default: "USER",
      select: false,
    },
    isSuspended: {
      type: Boolean,
      default: false,
      select: false,
    },
    profilePictureUrl: {
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
        message: "Profile picture URL must use HTTP or HTTPS.",
      },
    },
    college: {
      type: String,
      default: "",
      trim: true,
      maxlength: 120,
    },
    bio: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },
    subjects: {
      type: [
        {
          type: String,
          trim: true,
          maxlength: 50,
        },
      ],
      default: [],
      validate: {
        validator(subjects) {
          return subjects.length <= 12 && subjects.every(Boolean);
        },
        message: "Add up to 12 non-empty subjects.",
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_document, result) {
        delete result.email;
        delete result.passwordHash;
        return result;
      },
    },
  },
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
