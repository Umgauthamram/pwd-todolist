import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import User from "@/models/User";
import { hashPassword, generateOtp } from "@/lib/auth";
import { sendOtpEmail } from "@/lib/nodemailer";
import { isValidEmailDomain, EMAIL_ERROR_MESSAGE } from "@/lib/validators";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
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

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const existingUser = await User.findOne({ email: trimmedEmail });
    if (existingUser && existingUser.isVerified) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);
    const otp = generateOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    if (existingUser && !existingUser.isVerified) {
      // Re-use unverified record
      existingUser.passwordHash = hashedPassword;
      existingUser.otpCode = otp;
      existingUser.otpExpiresAt = otpExpiresAt;
      await existingUser.save();
    } else {
      await User.create({
        email: trimmedEmail,
        passwordHash: hashedPassword,
        isVerified: false,
        otpCode: otp,
        otpExpiresAt,
      });
    }

    await sendOtpEmail(trimmedEmail, otp);

    return NextResponse.json({
      success: true,
      message: "Verification code sent to your email address",
      email: trimmedEmail,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Failed to process registration" },
      { status: 500 }
    );
  }
}
