import { z } from "zod";
import { connectDatabase } from "@/lib/db";
import { fail, ok } from "@/lib/response";
import { requireRole } from "@/lib/api-auth";
import { ProductModel } from "@/models/Product";

const approveSchema = z.object({
  action: z.enum(["approve", "reject"]),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireRole(request, ["admin"]);
  if ("error" in auth) return fail(auth.error, auth.status);

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = approveSchema.safeParse(body);
    if (!parsed.success) return fail("Invalid payload. Provide action: approve | reject", 422);

    await connectDatabase();

    const newStatus = parsed.data.action === "approve" ? "active" : "archived";
    const product = await ProductModel.findByIdAndUpdate(
      id,
      { status: newStatus },
      { new: true }
    );

    if (!product) return fail("Product not found.", 404);
    return ok(product);
  } catch {
    return fail("Unable to update product status.", 500);
  }
}
