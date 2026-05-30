"use client";

import { useState } from "react";
import Link from "next/link";

export default function SetupPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function createAdmin() {
    setStatus("loading");
    try {
      const res = await fetch("/api/admin/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setupKey: "nexgro-admin-setup-2026" }),
      });
      const data = await res.json() as { success: boolean; message: string };
      setMessage(data.message);
      setStatus(data.success ? "success" : "error");
    } catch {
      setMessage("Failed to connect to server.");
      setStatus("error");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md fade-in">
        {/* Brand */}
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-700 shadow-md">
            <span className="material-symbols-outlined text-white text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
              admin_panel_settings
            </span>
          </div>
          <span className="font-[var(--font-orbitron)] text-xl font-bold tracking-wider text-gray-900">
            NexGro Setup
          </span>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-bold text-gray-900">Create Admin Account</h1>
          <p className="mt-1.5 text-sm text-gray-500">
            This will create the default admin account in your database.
          </p>

          {/* Credentials display */}
          <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4 space-y-2">
            <p className="text-xs font-bold text-green-800 uppercase tracking-wider">Admin Credentials</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-green-700">Phone Number</span>
              <span className="font-mono text-sm font-bold text-green-900">1234567890</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-green-700">Password</span>
              <span className="font-mono text-sm font-bold text-green-900">raju2105</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-green-700">Role</span>
              <span className="font-mono text-sm font-bold text-green-900">Admin</span>
            </div>
          </div>

          {/* Status message */}
          {message && (
            <div className={`mt-4 flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-sm ${
              status === "success"
                ? "border-green-200 bg-green-50 text-green-800"
                : "border-red-200 bg-red-50 text-red-700"
            }`}>
              <span className="material-symbols-outlined mt-0.5 text-base shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
                {status === "success" ? "check_circle" : "error"}
              </span>
              <span>{message}</span>
            </div>
          )}

          <button
            onClick={createAdmin}
            disabled={status === "loading" || status === "success"}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-green-700 py-3 text-sm font-bold text-white transition hover:bg-green-800 disabled:opacity-50"
          >
            {status === "loading" ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Creating admin account…
              </>
            ) : status === "success" ? (
              <>
                <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                Admin Created Successfully
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>admin_panel_settings</span>
                Create Admin Account
              </>
            )}
          </button>

          {status === "success" && (
            <div className="mt-4 flex flex-col gap-2">
              <Link
                href="/login"
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-green-200 bg-green-50 py-2.5 text-sm font-semibold text-green-800 hover:bg-green-100 transition-colors"
              >
                <span className="material-symbols-outlined text-base">login</span>
                Go to Login
              </Link>
              <p className="text-center text-xs text-gray-400">
                Login with phone <strong>1234567890</strong> and password <strong>raju2105</strong>
              </p>
            </div>
          )}
        </div>

        <div className="mt-4 rounded-xl border border-yellow-200 bg-yellow-50 p-3">
          <p className="text-xs text-yellow-800">
            <strong>⚠️ Important:</strong> Delete or disable this page after creating the admin account.
            This page should not be accessible in production.
          </p>
        </div>
      </div>
    </main>
  );
}
