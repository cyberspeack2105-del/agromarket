import { model, models, Schema, type InferSchemaType } from "mongoose";

const userSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["farmer", "buyer", "admin"],
      default: "buyer",
      required: true,
    },
    preferredLanguage: {
      type: String,
      enum: ["ta", "ml", "en"],
      default: "ta",
      required: true,
    },
    location: { type: String, trim: true },
    isVerified: { type: Boolean, default: false },
    verifiedAt: { type: Date },
  },
  { timestamps: true }
);

export type UserDocument = InferSchemaType<typeof userSchema>;
export const UserModel = models.User || model("User", userSchema);
