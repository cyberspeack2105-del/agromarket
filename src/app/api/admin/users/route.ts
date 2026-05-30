import { connectDatabase } from "@/lib/db";
import { fail, ok } from "@/lib/response";
import { requireRole } from "@/lib/api-auth";
import { UserModel } from "@/models/User";

export async function GET(request: Request) {
  const auth = requireRole(request, ["admin"]);
  if ("error" in auth) return fail(auth.error, auth.status);

  try {
    await connectDatabase();
    const users = await UserModel.find({}, { passwordHash: 0 })
      .sort({ createdAt: -1 })
      .lean();
    return ok(users);
  } catch {
    return fail("Unable to fetch users.", 500);
  }
}
