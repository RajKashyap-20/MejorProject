import mongoose from "mongoose";
import { requireAuthenticatedUser } from "../../server/auth.js";
import { findAccessibleConversation } from "../../server/conversation-access.js";
import { connectToDatabase } from "../../server/db.js";
import { decodeImageDataUrl, uploadAcadLinkImage } from "../../server/images.js";
import { handleApiError, allowMethods, parseJsonBody, sendJson } from "../../server/http.js";
import Conversation from "../../models/Conversation.js";
import Problem from "../../models/Problem.js";

const IMAGE_PURPOSES = new Set(["profile", "problem", "solution", "chat"]);

async function authorizeUpload({ purpose, resourceId, userId }) {
  if (!IMAGE_PURPOSES.has(purpose)) {
    throw new Error("Choose a valid image destination.");
  }

  if (purpose === "profile") {
    if (resourceId && resourceId !== userId) {
      const error = new Error("You can only upload a picture for your own profile.");
      error.statusCode = 403;
      throw error;
    }
    return userId;
  }

  if (purpose === "problem") {
    if (!resourceId) return "";
    if (!mongoose.isObjectIdOrHexString(resourceId)) {
      throw new Error("A valid problem ID is required.");
    }
    const problem = await Problem.exists({ _id: resourceId, author: userId });
    if (!problem) {
      const error = new Error("You can only attach images to your own problems.");
      error.statusCode = 403;
      throw error;
    }
    return resourceId;
  }

  if (!resourceId || !mongoose.isObjectIdOrHexString(resourceId)) {
    throw new Error(`A valid ${purpose === "chat" ? "conversation" : "problem"} ID is required.`);
  }

  if (purpose === "solution") {
    const problem = await Problem.exists({
      _id: resourceId,
      status: "OPEN",
    });
    if (!problem) {
      const error = new Error("This problem is not accepting solutions.");
      error.statusCode = 403;
      throw error;
    }
    return resourceId;
  }

  const conversation = await findAccessibleConversation(resourceId, userId);
  if (!conversation) {
    const error = new Error("You cannot upload to this conversation.");
    error.statusCode = 403;
    throw error;
  }
  return resourceId;
}

export default async function uploadImage(req, res) {
  if (!allowMethods(req, res, ["POST"])) return;
  const userId = await requireAuthenticatedUser(req, res);
  if (!userId) return;

  let request;
  let image;
  try {
    request = parseJsonBody(req.body);
    if (Object.keys(request).some(
      (key) => !["purpose", "resourceId", "dataUrl"].includes(key),
    )) {
      throw new Error("Only an image, destination, and destination ID are accepted.");
    }
    if (typeof request.purpose !== "string") {
      throw new Error("Choose a valid image destination.");
    }
    if (
      request.resourceId !== undefined &&
      typeof request.resourceId !== "string"
    ) {
      throw new Error("Destination ID must be a string.");
    }
    image = decodeImageDataUrl(request.dataUrl);
  } catch (error) {
    return sendJson(res, 400, { error: error.message });
  }

  try {
    await connectToDatabase();
    const resourceId = await authorizeUpload({
      purpose: request.purpose,
      resourceId: request.resourceId,
      userId,
    });
    const result = await uploadAcadLinkImage({
      buffer: image.buffer,
      mimeType: image.mimeType,
      purpose: request.purpose,
      resourceId,
    });
    return sendJson(res, 201, result);
  } catch (error) {
    if (error.statusCode) {
      return sendJson(res, error.statusCode, { error: error.message });
    }
    return handleApiError(res, error, "Image upload");
  }
}
