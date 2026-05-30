import { z } from "zod";
import { connectDatabase } from "@/lib/db";
import { fail, ok } from "@/lib/response";
import { requireRole } from "@/lib/api-auth";
import { UserModel } from "@/models/User";

const patchSchema = z.object({
  isVerified: z.boolean(),
});

/** PATCH /api/admin/users/[id] — verify or unverify a farmer */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = requireRole(request, ["admin"]);
  if ("error" in auth) return fail(auth.error, auth.status);

  const { id } = await context.params;
  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return fail("Invalid payload.", 422);

  try {
    await connectDatabase();
    const user = await UserModel.findByIdAndUpdate(
      id,
      {
        isVerified: parsed.data.isVerified,
        ...(parsed.data.isVerified ? { verifiedAt: new Date() } : { verifiedAt: null }),
      },
      { new: true, select: "-passwordHash" }
    );
    if (!user) return fail("User not found.", 404);
    return ok(user);
  } catch {
    return fail("Unable to update user.", 500);
  }
}
