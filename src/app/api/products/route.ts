import { z } from "zod";
import { connectDatabase } from "@/lib/db";
import { fail, ok } from "@/lib/response";
import { getAuthenticatedUser, requireRole } from "@/lib/api-auth";
import { ProductModel } from "@/models/Product";
import { UserModel } from "@/models/User";

const createProductSchema = z.object({
  farmerId: z.string().min(1),
  name: z.string().min(2),
  category: z.string().min(2),
  unit: z.string().default("kg"),
  quantityAvailable: z.number().nonnegative(),
  pricePerUnit: z.number().nonnegative(),
  region: z.string().min(2),
  description: z.string().optional(),
  imageUrls: z.array(z.string().min(1)).default([]),
});

export async function GET(request: Request) {
  try {
    await connectDatabase();
    const { searchParams } = new URL(request.url);
    const region = searchParams.get("region");
    const category = searchParams.get("category");
    const q = searchParams.get("q");
    const farmerId = searchParams.get("farmerId");

    const query: Record<string, unknown> = { status: "active" };

    if (region) query.region = region;
    if (category) query.category = category;
    if (q) query.$text = { $search: q };
    if (farmerId) {
      // When fetching own products, the caller must be authenticated and
      // requesting their own farmerId. Unauthenticated callers only see active
      // listings (no farmerId filter allowed).
      const caller = getAuthenticatedUser(request);
      if (!caller || caller.userId !== farmerId) {
        return fail("You can only view your own product listings.", 403);
      }
      query.farmerId = farmerId;
      delete query.status;
    }

    const products = await ProductModel.find(query).sort({ createdAt: -1 }).limit(50);
    return ok(products);
  } catch {
    return fail("Unable to fetch products.", 500);
  }
}

export async function POST(request: Request) {
  try {
    // Only farmers can create products
    const auth = requireRole(request, ["farmer", "admin"]);
    if ("error" in auth) return fail(auth.error, auth.status);

    const body = await request.json();
    const parsed = createProductSchema.safeParse(body);

    if (!parsed.success) {
      return fail("Invalid product payload.", 422);
    }

    // Prevent a farmer from creating products under another farmer's account
    if (parsed.data.farmerId !== auth.userId) {
      return fail("You can only create products for your own account.", 403);
    }

    await connectDatabase();

    // Determine status based on farmer verification
    let status: "active" | "pending_approval" = "pending_approval";
    if (auth.role === "admin") {
      status = "active";
    } else {
      const farmer = await UserModel.findById(auth.userId).lean();
      if (farmer && (farmer as { isVerified?: boolean }).isVerified === true) {
        status = "active";
      }
    }

    const product = await ProductModel.create({ ...parsed.data, status });
    return ok(product, 201);
  } catch {
    return fail("Unable to create product.", 500);
  }
}
