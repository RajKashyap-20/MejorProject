import mongoose from "mongoose";
import User from "../models/User.js";

const email = process.argv[2]?.trim().toLowerCase();
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error("Usage: npm run admin:promote -- user@example.edu");
  process.exitCode = 1;
} else if (!process.env.MONGODB_URI) {
  console.error("MONGODB_URI must be set before promoting an administrator.");
  process.exitCode = 1;
} else {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    const result = await User.updateOne(
      { email },
      { $set: { role: "ADMIN" } },
      { runValidators: true },
    );
    if (result.matchedCount === 0) {
      console.error("No account exists for that email address.");
      process.exitCode = 1;
    } else {
      console.log("Administrator role granted.");
    }
  } catch (error) {
    console.error(`Could not promote administrator: ${error.name || "UnknownError"}`);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}
