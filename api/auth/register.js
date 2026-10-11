import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { connectToDatabase } from "../../server/db.js";
import { createAuthCookie } from "../../server/auth-cookie.js";
import { handleApiError, allowMethods, parseJsonBody, sendJson } from "../../server/http.js";
import { validateRegistration } from "../../server/auth-validation.js";
import User from "../../models/User.js";

function safeUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    profilePictureUrl: user.profilePictureUrl || "",
    college: user.college || "",
    subjects: user.subjects || [],
    role: user.role || "USER",
  };
}

export default async function register(req, res) {
  if (!allowMethods(req, res, ["POST"])) return;
  let values;
  try {
    values = validateRegistration(parseJsonBody(req.body));
  } catch (error) {
    return sendJson(res, 400, { error: error.message });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    return sendJson(res, 503, { error: "The authentication service is not configured yet." });
  }

  try {
    await connectToDatabase();
    const passwordHash = await bcrypt.hash(values.password, 12);
    const user = await User.create({
      name: values.name,
      email: values.email,
      passwordHash,
      profilePictureUrl: values.profilePictureUrl,
      college: values.college,
      subjects: values.subjects,
    });
    const token = jwt.sign({}, secret, {
      subject: user._id.toString(),
      expiresIn: "7d",
    });
    res.setHeader("Set-Cookie", createAuthCookie(token));
    return sendJson(res, 201, { user: safeUser(user) });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.email) {
      return sendJson(res, 409, { error: "An account with this email already exists." });
    }
    return handleApiError(res, error, "Registration");
  }
}
