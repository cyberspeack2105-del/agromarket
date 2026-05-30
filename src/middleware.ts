import { NextRequest, NextResponse } from "next/server";

/**
 * Next.js Edge Middleware — runs before every matched /api/* request.
 *
 * Protected routes require a valid Bearer token in the Authorization header.
 * Public routes (auth endpoints, public product listing) are explicitly excluded.
 *
 * We verify the JWT signature using the Web Crypto API (SubtleCrypto) which is
 * available in the Edge Runtime without any additional dependencies.
 */

// Routes that bypass authentication entirely
const PUBLIC_PATTERNS: Array<{ path: string; method?: string }> = [
  { path: "/api/auth/login" },
  { path: "/api/auth/register" },
  { path: "/api/products", method: "GET" }, // public product browsing
  { path: "/api/admin/seed" },              // one-time admin setup
];

function isPublicRoute(pathname: string, method: string): boolean {
  return PUBLIC_PATTERNS.some((rule) => {
    if (rule.path !== pathname) return false;
    return !rule.method || rule.method === method;
  });
}

/**
 * Decode a base64url string to a Uint8Array.
 * JWT segments use base64url encoding (no padding, - instead of +, _ instead of /).
 */
function base64urlDecode(input: string): Uint8Array {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

/**
 * Verify a HS256 JWT using the Web Crypto SubtleCrypto API.
 * Returns true if the signature is valid and the token is not expired.
 */
async function verifyJwt(token: string, secret: string): Promise<boolean> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;

    const [headerB64, payloadB64, signatureB64] = parts;

    // Import the HMAC key
    const keyData = new TextEncoder().encode(secret);
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    // Verify the signature over "header.payload"
    const signingInput = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
    const signature = base64urlDecode(signatureB64);

    // Cast to ArrayBuffer to satisfy the strict BufferSource type in the Edge Runtime
    const isValid = await crypto.subtle.verify(
      "HMAC",
      cryptoKey,
      signature.buffer as ArrayBuffer,
      signingInput.buffer as ArrayBuffer
    );
    if (!isValid) return false;

    // Check expiry
    const payload = JSON.parse(new TextDecoder().decode(base64urlDecode(payloadB64)));
    if (payload.exp && Date.now() / 1000 > payload.exp) return false;

    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only guard /api/* routes
  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Skip public routes
  if (isPublicRoute(pathname, request.method)) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return NextResponse.json(
      { success: false, message: "Authentication required." },
      { status: 401 }
    );
  }

  const secret = process.env.JWT_SECRET ?? "";
  const valid = await verifyJwt(token, secret);

  if (!valid) {
    return NextResponse.json(
      { success: false, message: "Invalid or expired token." },
      { status: 401 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
