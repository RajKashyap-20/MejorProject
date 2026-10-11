import { PROBLEM_SUBJECTS } from "../models/Problem.js";

const EDITABLE_PROBLEM_FIELDS = new Set([
  "title",
  "description",
  "subject",
  "category",
  "imageUrl",
]);

function validateUrl(value) {
  if (!value) return "";
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error("Image must be a valid HTTP or HTTPS URL.");
  }
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Image must use HTTP or HTTPS.");
  }
  return value;
}

export function validateProblemInput(input, { partial = false } = {}) {
  const keys = Object.keys(input);
  if (!keys.length) throw new Error("Add at least one field to update.");
  for (const key of keys) {
    if (!EDITABLE_PROBLEM_FIELDS.has(key)) {
      throw new Error(`The ${key} field cannot be changed here.`);
    }
  }

  const result = {};
  if (!partial || Object.hasOwn(input, "title")) {
    if (
      typeof input.title !== "string" ||
      !input.title.trim() ||
      input.title.trim().length > 160
    ) {
      throw new Error("Title is required and must be 160 characters or fewer.");
    }
    result.title = input.title.trim();
  }

  if (!partial || Object.hasOwn(input, "description")) {
    if (
      typeof input.description !== "string" ||
      !input.description.trim() ||
      input.description.trim().length > 10000
    ) {
      throw new Error("Description is required and must be 10,000 characters or fewer.");
    }
    result.description = input.description.trim();
  }

  if (!partial || Object.hasOwn(input, "subject")) {
    if (typeof input.subject !== "string" || !PROBLEM_SUBJECTS.includes(input.subject)) {
      throw new Error("Choose a valid subject.");
    }
    result.subject = input.subject;
  }

  if (Object.hasOwn(input, "category") || !partial) {
    const category = input.category ?? "";
    if (typeof category !== "string" || category.trim().length > 80) {
      throw new Error("Category must be 80 characters or fewer.");
    }
    result.category = category.trim();
  }

  if (Object.hasOwn(input, "imageUrl") || !partial) {
    const imageUrl = input.imageUrl ?? "";
    if (typeof imageUrl !== "string" || imageUrl.length > 2048) {
      throw new Error("Image URL must be 2048 characters or fewer.");
    }
    result.imageUrl = validateUrl(imageUrl.trim());
  }

  return result;
}

export function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function readSingleQueryValue(value, fieldName) {
  if (Array.isArray(value) || typeof value !== "string") {
    throw new Error(`${fieldName} must be a single value.`);
  }
  return value;
}
