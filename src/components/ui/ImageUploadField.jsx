import { useRef, useState } from "react";
import { apiRequest } from "../../lib/api.js";

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read the selected image."));
    reader.readAsDataURL(file);
  });
}

function ImageUploadField({ purpose, resourceId, onUploaded }) {
  const fileInput = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function upload(event) {
    const [file] = event.target.files ?? [];
    event.target.value = "";
    if (!file) return;
    setError("");
    setMessage("");

    if (!IMAGE_TYPES.includes(file.type)) {
      setError("Choose a JPEG, PNG, WebP, or GIF image.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("Choose an image smaller than 2 MB.");
      return;
    }

    setUploading(true);
    try {
      const dataUrl = await readAsDataUrl(file);
      const result = await apiRequest("/api/uploads/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purpose, resourceId, dataUrl }),
      });
      onUploaded(result);
      setMessage("Image uploaded.");
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="image-upload-control">
      <input
        accept={IMAGE_TYPES.join(",")}
        className="visually-hidden"
        disabled={uploading}
        onChange={upload}
        ref={fileInput}
        type="file"
      />
      <button
        className="image-upload-button"
        disabled={uploading}
        onClick={() => fileInput.current?.click()}
        type="button"
      >
        <span aria-hidden="true">↑</span>
        {uploading ? "Uploading…" : "Choose image"}
      </button>
      <span className="image-upload-hint">JPEG, PNG, WebP or GIF · max 2 MB</span>
      {error && <span className="image-upload-error" role="alert">{error}</span>}
      {message && <span className="image-upload-success" role="status">{message}</span>}
    </div>
  );
}

export default ImageUploadField;
