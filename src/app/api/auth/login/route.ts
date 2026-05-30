import { z } from "zod";
import { connectDatabase } from "@/lib/db";
import { fail, ok } from "@/lib/response";
import { signAccessToken, verifyPassword } from "@/lib/auth";
import { UserModel } from "@/models/User";

const loginSchema = z.object({
  phone: z.string().min(8),
  password: z.string().min(6),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return fail("Invalid login data.", 422);
    }

    await connectDatabase();
    const user = await UserModel.findOne({ phone: parsed.data.phone });

    if (!user) {
      return fail("Invalid credentials.", 401);
    }

    const isValidPassword = await verifyPassword(
      parsed.data.password,
      user.passwordHash
    );

    if (!isValidPassword) {
      return fail("Invalid credentials.", 401);
    }

    const token = signAccessToken({
      userId: user.id,
      role: user.role,
      phone: user.phone,
    });

    return ok({
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        role: user.role,
        preferredLanguage: user.preferredLanguage,
        location: user.location,
      },
    });
  } catch {
    return fail("Unable to login right now.", 500);
  }
}
