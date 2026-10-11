export function sendJson(res, statusCode, body) {
  return res.status(statusCode).json(body);
}

export function allowMethods(req, res, methods) {
  if (!methods.includes(req.method)) {
    res.setHeader("Allow", methods.join(", "));
    sendJson(res, 405, { error: "Method not allowed." });
    return false;
  }
  return true;
}

export function parseJsonBody(body) {
  let parsed = body;

  if (Buffer.isBuffer(parsed)) parsed = parsed.toString("utf8");
  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      throw new Error("Request body must contain valid JSON.");
    }
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Request body must be a JSON object.");
  }
  return parsed;
}

export function handleApiError(res, error, context) {
  if (error.code === "MONGODB_URI_MISSING") {
    return sendJson(res, 503, { error: "The service is not configured yet." });
  }
  if (error.code === "CLOUDINARY_CONFIGURATION_MISSING") {
    return sendJson(res, 503, { error: "Image uploads are not configured yet." });
  }
  if (error.code === "CLOUDINARY_UPLOAD_FAILED") {
    return sendJson(res, 502, { error: "Image upload failed. Please try again." });
  }
  if (error.code === "ADMIN_DATABASE_ERROR") {
    console.error(`${context} failed: ${error.name || "UnknownError"}`);
    return sendJson(res, 500, { error: "Could not verify administrator access." });
  }

  console.error(`${context} failed: ${error.name || "UnknownError"}`);
  return sendJson(res, 500, { error: "Something went wrong. Please try again later." });
}
