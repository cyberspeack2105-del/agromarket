import { model, models, Schema, type InferSchemaType, Types } from "mongoose";

const productSchema = new Schema(
  {
    farmerId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    unit: { type: String, default: "kg", trim: true },
    quantityAvailable: { type: Number, required: true, min: 0 },
    pricePerUnit: { type: Number, required: true, min: 0 },
    region: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    imageUrls: [{ type: String }],
    status: {
      type: String,
      enum: ["draft", "active", "soldOut", "archived", "pending_approval"],
      default: "active",
      required: true,
    },
  },
  { timestamps: true }
);

productSchema.index({ name: "text", category: "text", region: "text" });

export type ProductDocument = InferSchemaType<typeof productSchema>;
export const ProductModel = models.Product || model("Product", productSchema);
