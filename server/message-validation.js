export function validateMessage(input, conversationId) {
  for (const key of Object.keys(input)) {
    if (!["text", "imagePublicId"].includes(key)) {
      throw new Error(`The ${key} field cannot be changed here.`);
    }
  }

  const text = input.text ?? "";
  const imagePublicId = input.imagePublicId ?? "";
  if (typeof text !== "string" || text.trim().length > 5000) {
    throw new Error("Message text must be 5,000 characters or fewer.");
  }
  if (typeof imagePublicId !== "string" || imagePublicId.length > 255) {
    throw new Error("Private image reference is invalid.");
  }
  if (!text.trim() && !imagePublicId.trim()) {
    throw new Error("A message must contain text or an image.");
  }

  const trimmedImage = imagePublicId.trim();
  if (
    trimmedImage &&
    !new RegExp(`^(?:acadlink|peersolve)/chat/${conversationId}/[a-f0-9-]{36}$`).test(trimmedImage)
  ) {
    throw new Error("Image must belong to this private conversation.");
  }
  return { text: text.trim(), imagePublicId: trimmedImage };
}
