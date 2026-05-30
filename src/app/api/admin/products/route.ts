import { connectDatabase } from "@/lib/db";
import { fail, ok } from "@/lib/response";
import { requireRole } from "@/lib/api-auth";
import { ProductModel } from "@/models/Product";

export async function GET(request: Request) {
  const auth = requireRole(request, ["admin"]);
  if ("error" in auth) return fail(auth.error, auth.status);

  try {
    await connectDatabase();
    const products = await ProductModel.find({})
      .populate("farmerId", "fullName phone location isVerified")
      .sort({ createdAt: -1 })
      .lean();
    return ok(products);
  } catch {
    return fail("Unable to fetch products.", 500);
  }
}
