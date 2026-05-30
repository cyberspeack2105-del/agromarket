"use client";

export type SessionUser = {
  id: string;
  fullName: string;
  role: "farmer" | "buyer" | "admin";
  preferredLanguage: "ta" | "ml" | "en";
  location?: string;
};

const TOKEN_KEY = "nexgro_token";
const USER_KEY = "nexgro_user";

function isBrowser() {
  return typeof window !== "undefined";
}

export function saveSession(token: string, user: SessionUser) {
  if (!isBrowser()) return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getToken() {
  if (!isBrowser()) return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getSessionUser(): SessionUser | null {
  if (!isBrowser()) return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export function clearSession() {
  if (!isBrowser()) return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * A drop-in replacement for `fetch` that automatically attaches the stored
 * JWT as a Bearer token in the Authorization header.
 *
 * Usage:
 *   const response = await authFetch("/api/products", { method: "POST", ... });
 */
export async function authFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const token = getToken();
  const headers = new Headers(init.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(input, { ...init, headers });
}
