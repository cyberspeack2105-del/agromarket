"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSessionUser, type SessionUser } from "@/lib/client-auth";
import Navbar from "@/components/Navbar";

export default function Home() {
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    setUser(getSessionUser());
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-gray-900">

      {/* ════════════════════════════════
          NAVBAR
      ════════════════════════════════ */}
      <Navbar />

      {/* ════════════════════════════════
          HERO
      ════════════════════════════════ */}
      <section className="relative flex min-h-screen items-center overflow-hidden bg-gradient-to-br from-green-50 via-white to-emerald-50 px-4 pt-24 pb-16 sm:px-6 lg:px-8">
        {/* Decorative background blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-green-100 opacity-60 blur-3xl" />
          <div className="absolute bottom-0 -left-20 h-80 w-80 rounded-full bg-emerald-100 opacity-50 blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl w-full">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            {/* Left — text */}
            <div className="fade-in">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-100 px-4 py-1.5">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-semibold uppercase tracking-widest text-green-700">
                  Live — AI Agro Platform
                </span>
              </div>

              <h1 className="font-[var(--font-orbitron)] text-3xl font-bold leading-tight text-gray-900 sm:text-4xl lg:text-5xl xl:text-6xl">
                Connecting{" "}
                <span className="text-green-700">Farmers</span>{" "}
                With Smart Technology
              </h1>

              <p className="mt-5 max-w-lg text-base leading-relaxed text-gray-600 sm:text-lg">
                AI-powered agricultural marketplace for farmers and buyers in remote regions.
                Sell crops, track orders, and get real-time farming advice — all in one place.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                {user ? (
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-700 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-green-200 transition-all hover:bg-green-800 hover:shadow-xl"
                  >
                    <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>dashboard</span>
                    Go to Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/register"
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-700 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-green-200 transition-all hover:bg-green-800 hover:shadow-xl"
                    >
                      <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>agriculture</span>
                      Join as Farmer / Buyer
                    </Link>
                    <Link
                      href="/marketplace"
                      className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-green-200 bg-white px-8 py-3.5 text-sm font-bold text-green-700 transition-all hover:border-green-400 hover:bg-green-50"
                    >
                      <span className="material-symbols-outlined text-base">storefront</span>
                      Browse Marketplace
                    </Link>
                  </>
                )}
              </div>

              {/* Trust stats */}
              <div className="mt-10 grid grid-cols-3 gap-4 border-t border-gray-100 pt-8">
                {[
                  { value: "2,400+", label: "Farmers" },
                  { value: "18,000+", label: "Orders" },
                  { value: "3 States", label: "Coverage" },
                ].map((s) => (
                  <div key={s.label}>
                    <p className="text-xl font-bold text-green-700 sm:text-2xl">{s.value}</p>
                    <p className="text-xs text-gray-500">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — feature cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                { icon: "agriculture",    title: "Sell Your Crops",       desc: "List produce directly to buyers. No middlemen.",          color: "bg-green-50 border-green-200" },
                { icon: "smart_toy",      title: "AI Farming Advice",     desc: "Get soil, weather and crop recommendations instantly.",   color: "bg-emerald-50 border-emerald-200" },
                { icon: "shopping_basket",title: "Buy Fresh Produce",     desc: "Order directly from verified local farmers.",             color: "bg-teal-50 border-teal-200" },
                { icon: "local_shipping", title: "Track Orders",          desc: "Real-time order status from farm to delivery.",           color: "bg-lime-50 border-lime-200" },
              ].map((f) => (
                <div key={f.title} className={`rounded-2xl border p-5 transition-all hover:-translate-y-1 hover:shadow-md ${f.color}`}>
                  <span className="material-symbols-outlined text-2xl text-green-700" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {f.icon}
                  </span>
                  <h3 className="mt-3 text-sm font-bold text-gray-800">{f.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-gray-600">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════
          HOW IT WORKS
      ════════════════════════════════ */}
      <section id="about" className="bg-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-green-600">Simple Process</p>
            <h2 className="font-[var(--font-orbitron)] mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
              How NexGro Works
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              { step: "01", icon: "person_add",      title: "Create Account",    desc: "Register as a farmer or buyer in under 2 minutes." },
              { step: "02", icon: "storefront",      title: "List or Browse",    desc: "Farmers list crops. Buyers browse and order directly." },
              { step: "03", icon: "local_shipping",  title: "Deliver & Earn",    desc: "Confirm orders, arrange delivery, and get paid." },
            ].map((s) => (
              <div key={s.step} className="relative rounded-2xl border border-gray-100 bg-gray-50 p-6 text-center">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-green-700 px-3 py-0.5 text-xs font-bold text-white">
                  {s.step}
                </span>
                <span className="material-symbols-outlined mt-4 text-3xl text-green-600" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {s.icon}
                </span>
                <h3 className="mt-3 text-sm font-bold text-gray-800">{s.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════
          CTA BANNER
      ════════════════════════════════ */}
      <section className="bg-green-700 px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-[var(--font-orbitron)] text-2xl font-bold text-white sm:text-3xl">
            Ready to grow smarter?
          </h2>
          <p className="mt-3 text-green-200">
            Join thousands of farmers and buyers already using NexGro.
          </p>
          <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/register"
              className="w-full rounded-xl bg-white px-8 py-3 text-sm font-bold text-green-800 transition-all hover:bg-green-50 sm:w-auto"
            >
              Create Free Account
            </Link>
            <Link
              href="/login"
              className="w-full rounded-xl border-2 border-green-500 px-8 py-3 text-sm font-bold text-white transition-all hover:bg-green-600 sm:w-auto"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════
          FOOTER
      ════════════════════════════════ */}
      <footer className="border-t border-gray-100 bg-white px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-700">
              <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
            </div>
            <span className="font-[var(--font-orbitron)] text-sm font-bold text-green-800">NexGro</span>
            <span className="ml-2 text-xs text-gray-400">© 2026 All rights reserved</span>
          </div>
          <div className="flex flex-wrap justify-center gap-5 text-sm text-gray-500">
            {["Privacy", "Terms", "Support"].map((l) => (
              <a key={l} href="#" className="hover:text-green-700 transition-colors">{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
