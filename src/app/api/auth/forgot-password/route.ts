import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import User from "@/models/User";
import { generateOtp } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/nodemailer";
import { isValidEmailDomain, EMAIL_ERROR_MESSAGE } from "@/lib/validators";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (!isValidEmailDomain(trimmedEmail)) {
      return NextResponse.json(
        { error: EMAIL_ERROR_MESSAGE },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const user = await User.findOne({ email: trimmedEmail });
    if (!user) {
      // Do not reveal whether user exists for security
      return NextResponse.json({
        success: true,
        message: "If an account exists with this email, a password reset code has been sent.",
      });
    }

    const otp = generateOtp();
    user.passwordResetToken = otp;
    user.passwordResetExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
    await user.save();

    await sendPasswordResetEmail(trimmedEmail, otp);

    return NextResponse.json({
      success: true,
      message: "If an account exists with this email, a password reset code has been sent.",
      email: trimmedEmail,
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Failed to process password reset request" },
      { status: 500 }
    );
  }
}
