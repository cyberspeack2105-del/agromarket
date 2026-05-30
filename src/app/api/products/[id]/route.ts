import { z } from "zod";
import { connectDatabase } from "@/lib/db";
import { fail, ok } from "@/lib/response";
import { requireRole } from "@/lib/api-auth";
import { ProductModel } from "@/models/Product";

const updateProductSchema = z.object({
  name: z.string().min(2),
  category: z.string().min(2),
  unit: z.string().min(1),
  quantityAvailable: z.number().nonnegative(),
  pricePerUnit: z.number().nonnegative(),
  region: z.string().min(2),
  description: z.string().optional(),
  imageUrls: z.array(z.string().min(1)).default([]),
});

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Only farmers (and admins) can update products
    const auth = requireRole(request, ["farmer", "admin"]);
    if ("error" in auth) return fail(auth.error, auth.status);

    const { id } = await context.params;
    const body = await request.json();
    const parsed = updateProductSchema.safeParse(body);

    if (!parsed.success) {
      return fail("Invalid product payload.", 422);
    }

    await connectDatabase();

    // Fetch first to verify ownership before mutating
    const existing = await ProductModel.findById(id);
    if (!existing) {
      return fail("Product not found.", 404);
    }

    // Admins can edit any product; farmers only their own
    if (auth.role !== "admin" && String(existing.farmerId) !== auth.userId) {
      return fail("You do not have permission to edit this product.", 403);
    }

    const updated = await ProductModel.findByIdAndUpdate(id, parsed.data, {
      new: true,
    });

    return ok(updated);
  } catch {
    return fail("Unable to update product.", 500);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Only farmers (and admins) can delete products
    const auth = requireRole(request, ["farmer", "admin"]);
    if ("error" in auth) return fail(auth.error, auth.status);

    const { id } = await context.params;
    await connectDatabase();

    // Fetch first to verify ownership before deleting
    const existing = await ProductModel.findById(id);
    if (!existing) {
      return fail("Product not found.", 404);
    }

    // Admins can delete any product; farmers only their own
    if (auth.role !== "admin" && String(existing.farmerId) !== auth.userId) {
      return fail("You do not have permission to delete this product.", 403);
    }

    await ProductModel.findByIdAndDelete(id);
    return ok({ id });
  } catch {
    return fail("Unable to delete product.", 500);
  }
}
