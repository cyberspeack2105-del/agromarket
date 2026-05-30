import { connectDatabase } from "@/lib/db";
import { fail, ok } from "@/lib/response";
import { requireRole } from "@/lib/api-auth";
import { UserModel } from "@/models/User";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireRole(request, ["admin"]);
  if ("error" in auth) return fail(auth.error, auth.status);

  try {
    const { id } = await params;
    await connectDatabase();

    const user = await UserModel.findByIdAndUpdate(
      id,
      { isVerified: true, verifiedAt: new Date() },
      { new: true, select: "-passwordHash" }
    );

    if (!user) return fail("User not found.", 404);
    if (user.role !== "farmer") return fail("Only farmers can be verified.", 400);

    return ok(user);
  } catch {
    return fail("Unable to verify farmer.", 500);
  }
}
