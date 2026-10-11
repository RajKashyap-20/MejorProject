export function validateSolutionInput(body) {
  const allowedFields = new Set(["content", "imageUrl"]);
  for (const key of Object.keys(body)) {
    if (!allowedFields.has(key)) {
      throw new Error(`The ${key} field cannot be changed here.`);
    }
  }

  if (
    typeof body.content !== "string" ||
    !body.content.trim() ||
    body.content.trim().length > 10000
  ) {
    throw new Error("Solution must contain 1 to 10,000 characters.");
  }

  const imageUrl = body.imageUrl ?? "";
  if (typeof imageUrl !== "string" || imageUrl.length > 2048) {
    throw new Error("Image URL must be 2048 characters or fewer.");
  }
  if (imageUrl.trim()) {
    let url;
    try {
      url = new URL(imageUrl.trim());
    } catch {
      throw new Error("Image must be a valid HTTP or HTTPS URL.");
    }
    if (!["http:", "https:"].includes(url.protocol)) {
      throw new Error("Image must use HTTP or HTTPS.");
    }
  }
  return { content: body.content.trim(), imageUrl: imageUrl.trim() };
}
