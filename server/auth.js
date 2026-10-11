import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { connectToDatabase } from "./db.js";
import { handleApiError, sendJson } from "./http.js";
import User from "../models/User.js";

const AUTH_COOKIE = "acadlink_token";
const LEGACY_AUTH_COOKIE = "peersolve_token";

function readCookie(req, name) {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;

  for (const cookie of cookieHeader.split(";")) {
    const separator = cookie.indexOf("=");
    if (separator < 0) continue;
    if (cookie.slice(0, separator).trim() === name) {
      return cookie.slice(separator + 1).trim();
    }
  }
  return null;
}

export async function requireAuthenticatedUser(req, res) {
  const token = readCookie(req, AUTH_COOKIE) || readCookie(req, LEGACY_AUTH_COOKIE);
  if (!token) {
    sendJson(res, 401, { error: "Please sign in to continue." });
    return null;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    sendJson(res, 503, { error: "The service is not configured yet." });
    return null;
  }

  let payload;
  try {
    payload = jwt.verify(token, secret);
  } catch {
    sendJson(res, 401, { error: "Please sign in to continue." });
    return null;
  }
  if (
    !payload ||
    typeof payload !== "object" ||
    typeof payload.sub !== "string" ||
    !mongoose.isValidObjectId(payload.sub)
  ) {
    sendJson(res, 401, { error: "Please sign in to continue." });
    return null;
  }

  try {
    await connectToDatabase();
    const user = await User.findById(payload.sub).select("+isSuspended").lean();
    if (!user) {
      sendJson(res, 401, { error: "Please sign in to continue." });
      return null;
    }
    if (user.isSuspended) {
      sendJson(res, 403, { error: "This account is suspended. Contact support for assistance." });
      return null;
    }
    return payload.sub;
  } catch (error) {
    return handleApiError(res, error, "Authentication");
  }
}

export function getOptionalAuthenticatedUser(req) {
  const token = readCookie(req, AUTH_COOKIE) || readCookie(req, LEGACY_AUTH_COOKIE);
  const secret = process.env.JWT_SECRET;
  if (!token || !secret || secret.length < 32) return null;

  try {
    const payload = jwt.verify(token, secret);
    if (
      payload &&
      typeof payload === "object" &&
      typeof payload.sub === "string" &&
      mongoose.isObjectIdOrHexString(payload.sub)
    ) {
      return payload.sub;
    }
  } catch {
    return null;
  }
  return null;
}
