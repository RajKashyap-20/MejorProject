export function validateSuspensionRequest(body) {
  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body) ||
    Object.keys(body).length !== 1 ||
    typeof body.suspended !== "boolean"
  ) {
    throw new Error("Request body must contain only a boolean suspended field.");
  }
  return body.suspended;
}

export function canSuspendUser(actorId, targetId, targetRole) {
  return actorId !== targetId && targetRole === "USER";
}
