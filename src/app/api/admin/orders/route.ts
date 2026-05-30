import { connectDatabase } from "@/lib/db";
import { fail, ok } from "@/lib/response";
import { requireRole } from "@/lib/api-auth";
import { OrderModel } from "@/models/Order";

export async function GET(request: Request) {
  const auth = requireRole(request, ["admin"]);
  if ("error" in auth) return fail(auth.error, auth.status);

  try {
    await connectDatabase();
    const orders = await OrderModel.find({})
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();
    return ok(orders);
  } catch {
    return fail("Unable to fetch orders.", 500);
  }
}
