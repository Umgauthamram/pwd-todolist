import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { connectToDatabase } from "@/lib/mongoose";
import User from "@/models/User";
import { getAuthUserFromRequest } from "@/lib/auth";
import { sendPinResetEmail } from "@/lib/nodemailer";

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUserFromRequest(request);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const user = await User.findById(authUser.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Generate secure single-use token (hex string)
    const token = crypto.randomBytes(16).toString("hex");
    user.pinResetToken = token;
    user.pinResetExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
    await user.save();

    // Construct reset URL for email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetUrl = `${appUrl}/reset-pin?token=${token}`;

    await sendPinResetEmail(user.email, resetUrl, token);

    return NextResponse.json({
      success: true,
      message: "A secure PIN reset link has been dispatched to your email address",
      email: user.email,
    });
  } catch (error) {
    console.error("Request PIN reset error:", error);
    return NextResponse.json(
      { error: "Failed to process PIN reset request" },
      { status: 500 }
    );
  }
}
