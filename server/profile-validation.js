export const editableFields = new Set([
  "name",
  "profilePictureUrl",
  "college",
  "bio",
  "subjects",
]);

export function validateProfileUpdate(input) {
  const keys = Object.keys(input);
  if (!keys.length) throw new Error("Add at least one field to update.");

  for (const key of keys) {
    if (!editableFields.has(key)) {
      throw new Error(`The ${key} field cannot be changed here.`);
    }
  }

  const update = {};
  if (Object.hasOwn(input, "name")) {
    if (
      typeof input.name !== "string" ||
      !input.name.trim() ||
      input.name.trim().length > 80
    ) {
      throw new Error("Name is required and must be 80 characters or fewer.");
    }
    update.name = input.name.trim();
  }

  if (Object.hasOwn(input, "college")) {
    if (typeof input.college !== "string" || input.college.trim().length > 120) {
      throw new Error("College or university must be 120 characters or fewer.");
    }
    update.college = input.college.trim();
  }

  if (Object.hasOwn(input, "bio")) {
    if (typeof input.bio !== "string" || input.bio.trim().length > 500) {
      throw new Error("Bio must be 500 characters or fewer.");
    }
    update.bio = input.bio.trim();
  }

  if (Object.hasOwn(input, "profilePictureUrl")) {
    if (
      typeof input.profilePictureUrl !== "string" ||
      input.profilePictureUrl.length > 2048
    ) {
      throw new Error("Profile picture URL must be 2048 characters or fewer.");
    }
    const value = input.profilePictureUrl.trim();
    if (value) {
      let url;
      try {
        url = new URL(value);
      } catch {
        throw new Error("Profile picture must be a valid HTTP or HTTPS URL.");
      }
      if (!["http:", "https:"].includes(url.protocol)) {
        throw new Error("Profile picture must use HTTP or HTTPS.");
      }
    }
    update.profilePictureUrl = value;
  }

  if (Object.hasOwn(input, "subjects")) {
    if (
      !Array.isArray(input.subjects) ||
      input.subjects.length > 12 ||
      input.subjects.some(
        (subject) =>
          typeof subject !== "string" ||
          !subject.trim() ||
          subject.trim().length > 50,
      )
    ) {
      throw new Error("Add up to 12 subjects, each between 1 and 50 characters.");
    }
    const uniqueSubjects = new Map();
    for (const subject of input.subjects) {
      const trimmed = subject.trim();
      const normalized = trimmed.toLowerCase();
      if (!uniqueSubjects.has(normalized)) {
        uniqueSubjects.set(normalized, trimmed);
      }
    }
    update.subjects = [...uniqueSubjects.values()];
  }

  return update;
}
