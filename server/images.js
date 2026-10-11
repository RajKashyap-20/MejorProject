import { v2 as cloudinary } from "cloudinary";
import { randomUUID } from "node:crypto";

export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const imageFormats = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);

export function decodeImageDataUrl(value) {
  if (typeof value !== "string" || value.length > MAX_IMAGE_BYTES * 1.4) {
    throw new Error("Choose an image smaller than 2 MB.");
  }

  const match = /^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!match) {
    throw new Error("Choose a JPEG, PNG, WebP, or GIF image.");
  }

  const buffer = Buffer.from(match[2], "base64");
  if (
    !buffer.length ||
    buffer.length > MAX_IMAGE_BYTES ||
    buffer.toString("base64") !== match[2]
  ) {
    throw new Error("Choose a valid image smaller than 2 MB.");
  }

  const validSignature = {
    "image/jpeg": buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff,
    "image/png": buffer.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    ),
    "image/webp":
      buffer.length >= 12 &&
      buffer.toString("ascii", 0, 4) === "RIFF" &&
      buffer.toString("ascii", 8, 12) === "WEBP",
    "image/gif":
      buffer.toString("ascii", 0, 6) === "GIF87a" ||
      buffer.toString("ascii", 0, 6) === "GIF89a",
  }[match[1]];

  if (!validSignature) throw new Error("Image content does not match its file type.");
  return { buffer, format: imageFormats.get(match[1]), mimeType: match[1] };
}

function configureCloudinary() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    const error = new Error("Cloudinary is not configured.");
    error.code = "CLOUDINARY_CONFIGURATION_MISSING";
    throw error;
  }

  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export async function uploadAcadLinkImage({ buffer, mimeType, purpose, resourceId }) {
  configureCloudinary();
  const isPrivate = purpose === "chat";
  const folder = isPrivate
    ? `acadlink/chat/${resourceId}`
    : `acadlink/${purpose}`;

  try {
    const result = await cloudinary.uploader.upload(
      `data:${mimeType};base64,${buffer.toString("base64")}`,
      {
        resource_type: "image",
        type: isPrivate ? "authenticated" : "upload",
        folder,
        public_id: randomUUID(),
        unique_filename: false,
        overwrite: false,
        use_filename: false,
      },
    );
    return {
      publicId: result.public_id,
      imageUrl: isPrivate
        ? createPrivateImageUrl(result.public_id)
        : result.secure_url,
    };
  } catch (error) {
    if (error.code === "CLOUDINARY_CONFIGURATION_MISSING") throw error;
    const uploadError = new Error("Cloudinary rejected the image upload.");
    uploadError.code = "CLOUDINARY_UPLOAD_FAILED";
    throw uploadError;
  }
}

export function createPrivateImageUrl(publicId) {
  configureCloudinary();
  return cloudinary.url(publicId, {
    secure: true,
    type: "authenticated",
    sign_url: true,
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
  });
}
