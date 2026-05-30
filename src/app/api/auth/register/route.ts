import { z } from "zod";
import { connectDatabase } from "@/lib/db";
import { fail, ok } from "@/lib/response";
import { hashPassword, signAccessToken } from "@/lib/auth";
import { UserModel } from "@/models/User";

const registerSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(8),
  password: z.string().min(6),
  role: z.enum(["farmer", "buyer"]).default("buyer"),
  preferredLanguage: z.enum(["ta", "ml", "en"]).default("ta"),
  location: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return fail("Invalid registration data.", 422);
    }

    await connectDatabase();

    const existing = await UserModel.findOne({ phone: parsed.data.phone });
    if (existing) {
      return fail("Phone number already registered.", 409);
    }

    const passwordHash = await hashPassword(parsed.data.password);
    const user = await UserModel.create({
      ...parsed.data,
      passwordHash,
    });

    const token = signAccessToken({
      userId: user.id,
      role: user.role,
      phone: user.phone,
    });

    return ok(
      {
        token,
        user: {
          id: user.id,
          fullName: user.fullName,
          role: user.role,
          preferredLanguage: user.preferredLanguage,
          location: user.location,
        },
      },
      201
    );
  } catch {
    return fail("Unable to register user right now.", 500);
  }
}
