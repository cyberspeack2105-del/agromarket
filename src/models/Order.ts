import { model, models, Schema, type InferSchemaType, Types } from "mongoose";

const orderItemSchema = new Schema(
  {
    productId: { type: Types.ObjectId, ref: "Product", required: true },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    farmerId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    buyerId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    items: { type: [orderItemSchema], required: true },
    totalAmount: { type: Number, required: true, min: 0 },
    paymentMode: {
      type: String,
      enum: ["cod", "upi"],
      default: "cod",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "packed", "delivered", "cancelled"],
      default: "pending",
      required: true,
    },
    deliveryNote: { type: String, trim: true },
  },
  { timestamps: true }
);

export type OrderDocument = InferSchemaType<typeof orderSchema>;
export const OrderModel = models.Order || model("Order", orderSchema);
