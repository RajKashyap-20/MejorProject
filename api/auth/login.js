import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { connectToDatabase } from "../../server/db.js";
import { createAuthCookie } from "../../server/auth-cookie.js";
import { handleApiError, allowMethods, parseJsonBody, sendJson } from "../../server/http.js";
import { validateLogin } from "../../server/auth-validation.js";
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

export default async function login(req, res) {
  if (!allowMethods(req, res, ["POST"])) return;
  let values;
  try {
    values = validateLogin(parseJsonBody(req.body));
  } catch (error) {
    return sendJson(res, 400, { error: error.message });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    return sendJson(res, 503, { error: "The authentication service is not configured yet." });
  }

  try {
    await connectToDatabase();
    const user = await User.findOne({ email: values.email })
      .select("+email +passwordHash +role +isSuspended")
      .exec();
    const passwordMatches = user
      ? await bcrypt.compare(values.password, user.passwordHash)
      : false;
    if (!passwordMatches) {
      return sendJson(res, 401, { error: "Email or password is incorrect." });
    }
    if (user.isSuspended) {
      return sendJson(res, 403, { error: "This account is suspended. Contact support for assistance." });
    }

    const token = jwt.sign({}, secret, {
      subject: user._id.toString(),
      expiresIn: "7d",
    });
    res.setHeader("Set-Cookie", createAuthCookie(token));
    return sendJson(res, 200, { user: safeUser(user) });
  } catch (error) {
    return handleApiError(res, error, "Login");
  }
}
