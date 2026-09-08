import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import User from "@/models/User";
import { hashPassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, otp, newPassword } = body;

    if (!email || !otp || !newPassword) {
      return NextResponse.json(
        { error: "Email, verification code, and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "New password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedOtp = otp.toString().trim();

    await connectToDatabase();

    const user = await User.findOne({ email: trimmedEmail });
    if (!user) {
      return NextResponse.json(
        { error: "Invalid request or expired code" },
        { status: 400 }
      );
    }

    if (!user.passwordResetToken || !user.passwordResetExpiresAt) {
      return NextResponse.json(
        { error: "No pending password reset request found. Please request a new code." },
        { status: 400 }
      );
    }

    if (new Date() > new Date(user.passwordResetExpiresAt)) {
      return NextResponse.json(
        { error: "Password reset code has expired. Please request a new code." },
        { status: 400 }
      );
    }

    if (user.passwordResetToken !== trimmedOtp) {
      return NextResponse.json(
        { error: "Invalid password reset code" },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(newPassword);
    user.passwordHash = hashedPassword;
    user.passwordResetToken = null;
    user.passwordResetExpiresAt = null;
    await user.save();

    return NextResponse.json({
      success: true,
      message: "Password reset successfully. You may now log in with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    );
  }
}
