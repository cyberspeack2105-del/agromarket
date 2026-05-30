"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveSession, type SessionUser } from "@/lib/client-auth";
import Navbar from "@/components/Navbar";

type RegisterResponse = {
  success: boolean;
  message?: string;
  data?: { token: string; user: SessionUser };
};

const ROLES = [
  { value: "farmer", label: "Farmer", sub: "விவசாயி", icon: "agriculture" },
  { value: "buyer",  label: "Buyer",  sub: "வாங்குபவர்", icon: "shopping_basket" },
];

const LANGUAGES = [
  { value: "ta", label: "Tamil",     native: "தமிழ்" },
  { value: "ml", label: "Malayalam", native: "മലയാളം" },
  { value: "en", label: "English",   native: "English" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState("buyer");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    const form = new FormData(e.currentTarget);
    const payload = {
      fullName:          String(form.get("fullName") ?? ""),
      phone:             String(form.get("phone") ?? ""),
      password:          String(form.get("password") ?? ""),
      role:              selectedRole,
      preferredLanguage: String(form.get("preferredLanguage") ?? "ta"),
      location:          String(form.get("location") ?? ""),
    };

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await res.json()) as RegisterResponse;

      if (!res.ok || !result.success || !result.data) {
        setError(result.message ?? "Registration failed.");
        return;
      }

      saveSession(result.data.token, result.data.user);
      router.push("/dashboard");
    } catch {
      setError("Unable to reach server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Navbar />
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 pt-24">
      <div className="w-full max-w-lg fade-in">
        {/* Brand */}
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-700 shadow-md">
            <span
              className="material-symbols-outlined text-white text-base"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              eco
            </span>
          </div>
          <span className="font-[var(--font-orbitron)] text-xl font-bold tracking-wider text-gray-900">
            NexGro
          </span>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">Create account</h1>
          <p className="mt-1.5 text-sm text-gray-500">
            Join the NexGro agricultural marketplace
          </p>

          <form onSubmit={onSubmit} className="mt-7 space-y-5">
            {/* Role selector */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500">
                I am a
              </label>
              <div className="grid grid-cols-2 gap-3">
                {ROLES.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setSelectedRole(r.value)}
                    className={`flex items-center gap-3 rounded-xl border p-3.5 text-left transition-all ${
                      selectedRole === r.value
                        ? "border-green-600 bg-green-50 text-gray-900 shadow-sm"
                        : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined text-xl ${
                        selectedRole === r.value ? "text-green-700" : "text-gray-400"
                      }`}
                      style={selectedRole === r.value ? { fontVariationSettings: "'FILL' 1" } : {}}
                    >
                      {r.icon}
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{r.label}</p>
                      <p className="text-[10px] text-gray-400">{r.sub}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Full name */}
            <Field icon="person" label="Full Name" name="fullName" placeholder="e.g. Arumugam Pillai" required />

            {/* Phone + Location */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field icon="phone" label="Phone Number" name="phone" placeholder="+91 98765 43210" required />
              <Field icon="location_on" label="Location" name="location" placeholder="e.g. Kanthalloor" />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500">
                Password
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-base text-gray-400">
                  lock
                </span>
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Min. 6 characters"
                  className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-10 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <span className="material-symbols-outlined text-base">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {/* Language */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500">
                Preferred Language
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-base text-gray-400">
                  language
                </span>
                <select
                  name="preferredLanguage"
                  defaultValue="ta"
                  className="w-full appearance-none rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-8 text-sm text-gray-900 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.value} value={l.value}>
                      {l.label} ({l.native})
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-base text-gray-400">
                  expand_more
                </span>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">
                <span className="material-symbols-outlined mt-0.5 text-base shrink-0">error</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg bg-green-700 py-2.5 text-sm font-semibold text-white transition hover:bg-green-800 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Creating account…
                </>
              ) : (
                <>
                  Create Account
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-5 text-sm">
            <span className="text-gray-500">Already have an account?</span>
            <Link
              href="/login"
              className="font-semibold text-green-700 hover:text-green-800 transition-colors"
            >
              Sign in →
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          By creating an account you agree to our Terms of Service
        </p>
      </div>
    </main>
    </>
  );
}

/* ── Reusable field ── */
function Field({
  icon,
  label,
  name,
  placeholder,
  required,
  type = "text",
}: {
  icon: string;
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500">
        {label}
      </label>
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-base text-gray-400">
          {icon}
        </span>
        <input
          name={name}
          type={type}
          required={required}
          placeholder={placeholder}
          className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
        />
      </div>
    </div>
  );
}
