import { z } from "zod";
import { connectDatabase } from "@/lib/db";
import { fail, ok } from "@/lib/response";
import { getAuthenticatedUser, requireRole } from "@/lib/api-auth";
import { OrderModel } from "@/models/Order";
import { UserModel } from "@/models/User";

const orderItemSchema = z.object({
  productId: z.string().min(1),
  productName: z.string().min(2),
  quantity: z.number().min(1),
  unitPrice: z.number().nonnegative(),
});

const createOrderSchema = z.object({
  farmerId: z.string().min(1),
  buyerId: z.string().min(1),
  items: z.array(orderItemSchema).min(1),
  paymentMode: z.enum(["cod", "upi"]).default("cod"),
  deliveryNote: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    // Only buyers (and admins) can place orders
    const auth = requireRole(request, ["buyer", "admin"]);
    if ("error" in auth) return fail(auth.error, auth.status);

    const body = await request.json();
    const parsed = createOrderSchema.safeParse(body);

    if (!parsed.success) {
      return fail("Invalid order payload.", 422);
    }

    // Prevent a buyer from placing an order on behalf of another buyer
    if (parsed.data.buyerId !== auth.userId) {
      return fail("You can only place orders for your own account.", 403);
    }

    await connectDatabase();

    const totalAmount = parsed.data.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );

    const order = await OrderModel.create({
      ...parsed.data,
      totalAmount,
    });

    const farmerUser = await UserModel.findById(parsed.data.farmerId);
    const farmerPhone = farmerUser?.phone || "";
    const farmerName = farmerUser?.fullName || "";

    return ok({ order, farmerPhone, farmerName }, 201);
  } catch (error) {
    console.error("Order creation failure:", error);
    return fail("Unable to place order.", 500);
  }
}

export async function GET(request: Request) {
  try {
    const caller = getAuthenticatedUser(request);
    if (!caller) return fail("Authentication required.", 401);

    const url = new URL(request.url);
    const farmerId = url.searchParams.get("farmerId");
    const buyerId = url.searchParams.get("buyerId");

    await connectDatabase();

    if (farmerId) {
      // Farmers can only view their own incoming orders; admins can view any
      if (caller.role !== "admin" && caller.userId !== farmerId) {
        return fail("You can only view your own orders.", 403);
      }
      const orders = await OrderModel.find({ farmerId }).sort({ createdAt: -1 });
      return ok(orders);
    }

    if (buyerId) {
      // Buyers can only view their own orders; admins can view any
      if (caller.role !== "admin" && caller.userId !== buyerId) {
        return fail("You can only view your own orders.", 403);
      }
      const orders = await OrderModel.find({ buyerId }).sort({ createdAt: -1 });
      return ok(orders);
    }

    // Admins can list all orders when no filter is provided
    if (caller.role === "admin") {
      const orders = await OrderModel.find({}).sort({ createdAt: -1 }).limit(100);
      return ok(orders);
    }

    return fail("Provide either farmerId or buyerId query parameter.", 400);
  } catch {
    return fail("Unable to fetch orders.", 500);
  }
}
