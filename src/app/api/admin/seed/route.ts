import { connectDatabase } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { UserModel } from "@/models/User";
import { NextResponse } from "next/server";

/**
 * POST /api/admin/seed
 * Creates the default admin account if it doesn't already exist.
 * This endpoint is protected by a secret key to prevent abuse.
 *
 * Admin credentials:
 *   Phone:    1234567890
 *   Password: raju2105
 */
export async function POST(request: Request) {
  try {
    // Simple guard — require a setup secret in the request body
    const body = await request.json() as { setupKey?: string };
    if (body.setupKey !== "nexgro-admin-setup-2026") {
      return NextResponse.json({ success: false, message: "Invalid setup key." }, { status: 403 });
    }

    await connectDatabase();

    // Check if admin already exists
    const existing = await UserModel.findOne({ phone: "1234567890", role: "admin" });
    if (existing) {
      return NextResponse.json({
        success: true,
        message: "Admin account already exists.",
        data: { phone: "1234567890", role: "admin" },
      });
    }

    // Create admin
    const passwordHash = await hashPassword("raju2105");
    const admin = await UserModel.create({
      fullName:          "Admin",
      phone:             "1234567890",
      passwordHash,
      role:              "admin",
      preferredLanguage: "en",
      location:          "NexGro HQ",
      isVerified:        true,
    });

    return NextResponse.json({
      success: true,
      message: "Admin account created successfully.",
      data: { id: admin.id, phone: "1234567890", role: "admin" },
    }, { status: 201 });

  } catch (err) {
    console.error("Admin seed error:", err);
    return NextResponse.json({ success: false, message: "Failed to create admin." }, { status: 500 });
  }
}
