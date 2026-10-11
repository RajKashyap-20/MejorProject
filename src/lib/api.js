export async function apiRequest(path, options = {}) {
  const response = await fetch(path, {
    credentials: "include",
    ...options,
  });
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error(
      "The API is unavailable. Start the Vercel development server and configure the database.",
    );
  }

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "The request could not be completed.");
  }
  return result;
}
