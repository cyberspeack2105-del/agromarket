import { NextRequest } from "next/server";
import { fail, ok } from "@/lib/response";
import { getAuthenticatedUser } from "@/lib/api-auth";

/** Max file size: 2 MB (Base64 stored in DB — keep small) */
const MAX_BYTES = 2 * 1024 * 1024;

/** Allowed MIME types */
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

export async function POST(request: NextRequest) {
  // Must be authenticated
  const caller = getAuthenticatedUser(request);
  if (!caller) return fail("Authentication required.", 401);

  // Only farmers and admins can upload product images
  if (caller.role !== "farmer" && caller.role !== "admin") {
    return fail("Only farmers can upload product images.", 403);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return fail("Invalid multipart form data.", 400);
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return fail("No file provided. Send a multipart field named 'file'.", 400);
  }

  // Validate type
  if (!ALLOWED_TYPES.has(file.type)) {
    return fail(
      `Unsupported file type: ${file.type}. Allowed: JPEG, PNG, WebP.`,
      415
    );
  }

  // Validate size
  if (file.size > MAX_BYTES) {
    return fail(
      `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 2 MB.`,
      413
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    return ok(
      {
        url: dataUrl,
        publicId: `local_${Date.now()}`,
        width: 0,
        height: 0,
        format: file.type.split("/")[1],
      },
      201
    );
  } catch (err) {
    console.error("Image processing failed:", err);
    return fail("Image processing failed. Please try again.", 500);
  }
}
