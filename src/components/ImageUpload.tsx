"use client";

import { useRef, useState } from "react";
import { getToken } from "@/lib/client-auth";

type UploadedImage = { url: string; publicId: string };
type Props = { value: string[]; onChange: (urls: string[]) => void; maxImages?: number };
type UploadState = { status: "idle" } | { status: "uploading"; progress: number } | { status: "error"; message: string };

export default function ImageUpload({ value, onChange, maxImages = 4 }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadState, setUploadState] = useState<UploadState>({ status: "idle" });
  const [isDragging, setIsDragging] = useState(false);
  const canAddMore = value.length < maxImages;

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0 || !canAddMore) return;
    const file  = files[0];
    const token = getToken();
    if (!token) { setUploadState({ status: "error", message: "You must be logged in to upload images." }); return; }

    const ALLOWED = ["image/jpeg","image/jpg","image/png","image/webp"];
    if (!ALLOWED.includes(file.type)) { setUploadState({ status: "error", message: `Unsupported type: ${file.type}. Allowed: JPEG, PNG, WebP.` }); return; }
    if (file.size > 2 * 1024 * 1024) { setUploadState({ status: "error", message: `File too large (${(file.size/1024/1024).toFixed(1)} MB). Max 2 MB.` }); return; }

    setUploadState({ status: "uploading", progress: 0 });
    const form = new FormData();
    form.append("file", file);

    try {
      const result = await new Promise<UploadedImage>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) setUploadState({ status: "uploading", progress: Math.round((e.loaded / e.total) * 100) });
        });
        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const body = JSON.parse(xhr.responseText) as { success: boolean; data?: UploadedImage; message?: string };
              if (body.success && body.data) resolve(body.data);
              else reject(new Error(body.message ?? "Upload failed."));
            } catch { reject(new Error("Invalid server response.")); }
          } else {
            try { const b = JSON.parse(xhr.responseText) as { message?: string }; reject(new Error(b.message ?? `Error ${xhr.status}`)); }
            catch { reject(new Error(`Error ${xhr.status}`)); }
          }
        });
        xhr.addEventListener("error", () => reject(new Error("Network error.")));
        xhr.open("POST", "/api/upload");
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        xhr.send(form);
      });
      onChange([...value, result.url]);
      setUploadState({ status: "idle" });
    } catch (err) {
      setUploadState({ status: "error", message: err instanceof Error ? err.message : "Upload failed." });
    }
  }

  function removeImage(index: number) { onChange(value.filter((_, i) => i !== index)); }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    void handleFiles(e.dataTransfer.files);
  }

  const isUploading = uploadState.status === "uploading";

  return (
    <div className="space-y-3">
      {/* Existing images */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {value.map((url, i) => (
            <div key={url} className="group relative aspect-square overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Product image ${i + 1}`} className="h-full w-full object-cover" />
              <button type="button" onClick={() => removeImage(i)}
                className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
                aria-label="Remove image">
                <span className="material-symbols-outlined text-2xl text-red-400">delete</span>
              </button>
              {i === 0 && (
                <span className="absolute left-1.5 top-1.5 rounded-full bg-green-700 px-1.5 py-0.5 text-[9px] font-bold text-white">MAIN</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      {canAddMore && (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => !isUploading && inputRef.current?.click()}
          className={`relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-all ${
            isDragging ? "border-green-500 bg-green-50" : "border-gray-200 bg-gray-50 hover:border-green-400 hover:bg-green-50"
          } ${isUploading ? "pointer-events-none opacity-70" : ""}`}
        >
          {isUploading ? (
            <>
              <div className="h-10 w-10 rounded-full border-2 border-green-200 border-t-green-700 animate-spin" />
              <p className="text-sm font-medium text-gray-700">Uploading… {(uploadState as { progress: number }).progress}%</p>
              <div className="w-full max-w-xs rounded-full bg-gray-200 h-1.5 overflow-hidden">
                <div className="h-full bg-green-700 rounded-full transition-all duration-200"
                  style={{ width: `${(uploadState as { progress: number }).progress}%` }} />
              </div>
            </>
          ) : (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-gray-200 bg-white">
                <span className="material-symbols-outlined text-2xl text-gray-400">cloud_upload</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">Drop image here or <span className="text-green-700">browse</span></p>
                <p className="mt-0.5 text-xs text-gray-400">JPEG, PNG, WebP · Max 2 MB · {value.length}/{maxImages} uploaded</p>
              </div>
            </>
          )}
          <input ref={inputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp"
            className="sr-only" onChange={(e) => void handleFiles(e.target.files)} disabled={isUploading} />
        </div>
      )}

      {/* Error */}
      {uploadState.status === "error" && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
          <span className="material-symbols-outlined mt-0.5 text-base shrink-0">error</span>
          <span>{uploadState.message}</span>
          <button type="button" onClick={() => setUploadState({ status: "idle" })} className="ml-auto shrink-0 hover:text-red-900 transition-colors">
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      )}
    </div>
  );
}
