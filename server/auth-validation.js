import { validateProfileUpdate } from "./profile-validation.js";

export function validateRegistration(input) {
  const allowedFields = new Set([
    "name",
    "email",
    "password",
    "confirmPassword",
    "profilePictureUrl",
    "college",
    "subjects",
  ]);
  for (const key of Object.keys(input)) {
    if (!allowedFields.has(key)) {
      throw new Error(`The ${key} field cannot be set during registration.`);
    }
  }

  if (
    typeof input.name !== "string" ||
    !input.name.trim() ||
    input.name.trim().length > 80
  ) {
    throw new Error("Name is required and must be 80 characters or fewer.");
  }

  const email = normalizeEmail(input.email);
  validatePassword(input.password);
  if (
    typeof input.confirmPassword !== "string" ||
    input.confirmPassword !== input.password
  ) {
    throw new Error("Passwords do not match.");
  }

  const profile = validateProfileUpdate({
    profilePictureUrl: input.profilePictureUrl ?? "",
    college: input.college ?? "",
    subjects: input.subjects ?? [],
  });

  return {
    name: input.name.trim(),
    email,
    password: input.password,
    ...profile,
  };
}

export function validateLogin(input) {
  const email = normalizeEmail(input.email);
  if (
    typeof input.password !== "string" ||
    input.password.length < 1 ||
    Buffer.byteLength(input.password, "utf8") > 72
  ) {
    throw new Error("Enter a valid password.");
  }
  return { email, password: input.password };
}

function normalizeEmail(value) {
  if (typeof value !== "string" || value.trim().length > 254) {
    throw new Error("Enter a valid email address.");
  }
  const email = value.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Enter a valid email address.");
  }
  return email;
}

function validatePassword(password) {
  if (
    typeof password !== "string" ||
    password.length < 8 ||
    Buffer.byteLength(password, "utf8") > 72
  ) {
    throw new Error("Password must be at least 8 characters and no more than 72 bytes.");
  }
}
