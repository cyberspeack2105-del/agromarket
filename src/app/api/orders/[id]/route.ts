import { z } from "zod";
import { connectDatabase } from "@/lib/db";
import { fail, ok } from "@/lib/response";
import { requireRole } from "@/lib/api-auth";
import { OrderModel } from "@/models/Order";

const updateOrderStatusSchema = z.object({
  status: z.enum(["pending", "confirmed", "packed", "delivered", "cancelled"]),
});

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Only farmers (and admins) can update order status
    const auth = requireRole(request, ["farmer", "admin"]);
    if ("error" in auth) return fail(auth.error, auth.status);

    const { id } = await context.params;
    const body = await request.json();
    const parsed = updateOrderStatusSchema.safeParse(body);

    if (!parsed.success) {
      return fail("Invalid status value.", 422);
    }

    await connectDatabase();

    // Fetch first to verify the farmer owns this order
    const existing = await OrderModel.findById(id);
    if (!existing) {
      return fail("Order not found.", 404);
    }

    // Admins can update any order; farmers only orders assigned to them
    if (auth.role !== "admin" && String(existing.farmerId) !== auth.userId) {
      return fail("You do not have permission to update this order.", 403);
    }

    const updated = await OrderModel.findByIdAndUpdate(
      id,
      { status: parsed.data.status },
      { new: true }
    );

    return ok(updated);
  } catch {
    return fail("Unable to update order status.", 500);
  }
}
