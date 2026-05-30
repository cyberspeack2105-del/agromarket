import { verifyAccessToken, type AuthTokenPayload } from "@/lib/auth";

/**
 * Extracts and verifies the JWT from the Authorization header.
 *
 * Returns the decoded token payload on success.
 * Returns null if the header is missing or the token is invalid/expired.
 *
 * Usage in a route handler:
 *   const caller = getAuthenticatedUser(request);
 *   if (!caller) return fail("Unauthorized.", 401);
 */
export function getAuthenticatedUser(
  request: Request
): AuthTokenPayload | null {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice(7); // strip "Bearer "
  try {
    return verifyAccessToken(token);
  } catch {
    // Token is expired, tampered, or invalid
    return null;
  }
}

/**
 * Asserts the request is authenticated and the caller has one of the
 * allowed roles. Returns the payload or a typed error object.
 *
 * Usage:
 *   const auth = requireRole(request, ["farmer"]);
 *   if ("error" in auth) return fail(auth.error, auth.status);
 */
export function requireRole(
  request: Request,
  allowedRoles: AuthTokenPayload["role"][]
): AuthTokenPayload | { error: string; status: number } {
  const caller = getAuthenticatedUser(request);

  if (!caller) {
    return { error: "Authentication required.", status: 401 };
  }

  if (!allowedRoles.includes(caller.role)) {
    return { error: "You do not have permission to perform this action.", status: 403 };
  }

  return caller;
}
