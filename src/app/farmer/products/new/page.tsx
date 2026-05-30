"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { getSessionUser, getToken, type SessionUser } from "@/lib/client-auth";

type ApiResponse = { success: boolean; message?: string };

export default function NewProductPage() {
  const router = useRouter();
  const [user]  = useState<SessionUser | null>(() => getSessionUser());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  const [error,  setError]  = useState("");

  useEffect(() => { if (!user) router.replace("/login"); }, [router, user]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    setError(""); setNotice(""); setIsSubmitting(true);

    const form = new FormData(event.currentTarget);
    const payload = {
      farmerId:          user.id,
      name:              String(form.get("name") ?? ""),
      category:          String(form.get("category") ?? ""),
      unit:              String(form.get("unit") ?? "kg"),
      quantityAvailable: Number(form.get("quantityAvailable") ?? 0),
      pricePerUnit:      Number(form.get("pricePerUnit") ?? 0),
      region:            String(form.get("region") ?? ""),
      description:       String(form.get("description") ?? ""),
      imageUrls: [],
    };

    try {
      const token = getToken();
      const res = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      const result = (await res.json()) as ApiResponse;
      if (!res.ok || !result.success) { setError(result.message ?? "Unable to add product."); return; }
      setNotice("Product listed successfully. Pending admin approval.");
      (event.currentTarget as HTMLFormElement).reset();
    } catch {
      setError("Server not reachable. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!user) return <main className="min-h-screen bg-white p-6 text-gray-900">Loading…</main>;

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 text-gray-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Add New Product</h1>
            <p className="mt-0.5 text-sm text-gray-500">List your crop for buyers to discover</p>
          </div>
          <Link href="/dashboard" className="flex items-center gap-1 text-sm font-medium text-green-700 hover:text-green-800 transition-colors">
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Dashboard
          </Link>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Product Name"        name="name"              required />
              <Field label="Category"            name="category"          required />
              <Field label="Unit (kg/litre/box)" name="unit"              defaultValue="kg" required />
              <Field label="Region"              name="region"            defaultValue="Kanthalloor" required />
              <Field label="Quantity Available"  name="quantityAvailable" type="number" required />
              <Field label="Price per Unit (Rs)" name="pricePerUnit"      type="number" required />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                Description
              </label>
              <textarea
                name="description"
                rows={3}
                placeholder="Describe your produce — freshness, harvest date, quality…"
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">
                <span className="material-symbols-outlined mt-0.5 text-base shrink-0">error</span>
                {error}
              </div>
            )}
            {notice && (
              <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-3.5 py-3 text-sm text-green-800">
                <span className="material-symbols-outlined mt-0.5 text-base shrink-0">check_circle</span>
                {notice}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-700 py-3 text-sm font-bold text-white transition hover:bg-green-800 disabled:opacity-50"
            >
              {isSubmitting ? (
                <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Listing…</>
              ) : (
                <><span className="material-symbols-outlined text-base">add_circle</span> List Product</>
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

function Field({ label, name, type = "text", defaultValue, required }: {
  label: string; name: string; type?: string; defaultValue?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</label>
      <input
        name={name} type={type} defaultValue={defaultValue} required={required}
        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
      />
    </div>
  );
}
