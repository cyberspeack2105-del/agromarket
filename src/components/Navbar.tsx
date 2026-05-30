"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSessionUser, clearSession, type SessionUser } from "@/lib/client-auth";

export default function Navbar() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    setUser(getSessionUser());
  }, []);

  function handleLogout() {
    clearSession();
    setUser(null);
    setMobileMenuOpen(false);
    router.push("/");
  }

  const initial = user?.fullName?.charAt(0).toUpperCase() ?? "";

  const navLinks = [
    { label: "Home",      href: "/" },
    { label: "Dashboard", href: "/dashboard" },
    { label: "About",     href: "/#about" },
  ];

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-green-100 bg-white/95 backdrop-blur-md shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">

        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-green-700 to-green-500 shadow-md">
            <span
              className="material-symbols-outlined text-white text-base"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              eco
            </span>
          </div>
          <span className="font-[var(--font-orbitron)] text-lg font-bold tracking-wide text-green-800">
            NexGro
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden items-center gap-6 md:flex">
          {navLinks.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-sm font-medium text-gray-600 transition-colors hover:text-green-700"
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Desktop right — auth or profile */}
        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-700 text-xs font-bold text-white">
                  {initial}
                </div>
                <div className="leading-tight">
                  <p className="text-xs font-semibold text-gray-800">{user.fullName}</p>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-green-600">
                    {user.role}
                  </p>
                </div>
              </div>
              <Link
                href="/dashboard"
                className="rounded-lg bg-green-700 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-green-800"
              >
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:border-red-200 hover:text-red-600"
              >
                Logout
              </button>
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg border border-green-200 px-4 py-2 text-sm font-semibold text-green-700 transition-colors hover:bg-green-50"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-green-700 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-green-800 shadow-sm"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="flex items-center justify-center rounded-lg p-2 text-gray-600 hover:bg-green-50 md:hidden"
          onClick={() => setMobileMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <span className="material-symbols-outlined text-xl">
            {mobileMenuOpen ? "close" : "menu"}
          </span>
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="border-t border-green-100 bg-white px-4 pb-4 pt-2 md:hidden">
          {user && (
            <div className="mb-3 flex items-center gap-3 rounded-xl bg-green-50 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-700 text-sm font-bold text-white">
                {initial}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{user.fullName}</p>
                <p className="text-xs font-medium uppercase tracking-wider text-green-600">{user.role}</p>
                {user.location && <p className="text-xs text-gray-500">{user.location}</p>}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1">
            {navLinks.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors"
              >
                {item.label}
              </Link>
            ))}

            <div className="mt-3 flex gap-2 border-t border-gray-100 pt-3">
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 rounded-lg bg-green-700 py-2.5 text-center text-sm font-bold text-white"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-600"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 rounded-lg border border-green-200 py-2.5 text-center text-sm font-semibold text-green-700"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 rounded-lg bg-green-700 py-2.5 text-center text-sm font-bold text-white"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
