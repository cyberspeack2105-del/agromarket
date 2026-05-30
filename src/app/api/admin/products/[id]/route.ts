import { z } from "zod";
import { connectDatabase } from "@/lib/db";
import { fail, ok } from "@/lib/response";
import { requireRole } from "@/lib/api-auth";
import { ProductModel } from "@/models/Product";

const patchSchema = z.object({
  status: z.enum(["active", "archived", "pending_approval"]),
});

/** PATCH /api/admin/products/[id] — approve or reject a product */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = requireRole(request, ["admin"]);
  if ("error" in auth) return fail(auth.error, auth.status);

  const { id } = await context.params;
  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return fail("Invalid status value.", 422);

  try {
    await connectDatabase();
    const product = await ProductModel.findByIdAndUpdate(
      id,
      { status: parsed.data.status },
      { new: true }
    );
    if (!product) return fail("Product not found.", 404);
    return ok(product);
  } catch {
    return fail("Unable to update product.", 500);
  }
}
