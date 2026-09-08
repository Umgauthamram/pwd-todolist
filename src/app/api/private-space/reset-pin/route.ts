import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import User from "@/models/User";
import {
  hashPassword,
  signPinToken,
  PIN_SESSION_COOKIE_NAME,
  getAuthUserFromRequest,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, newPin } = body;

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Reset token is required" },
        { status: 400 }
      );
    }

    if (!newPin || typeof newPin !== "string" || !/^\d{4}$/.test(newPin)) {
      return NextResponse.json(
        { error: "New PIN must be exactly 4 numeric digits" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Find user by token
    const user = await User.findOne({ pinResetToken: token.trim() });
    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    if (!user.pinResetExpiresAt || new Date() > new Date(user.pinResetExpiresAt)) {
      return NextResponse.json(
        { error: "Reset token has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Hash and store new PIN
    const newPinHash = await hashPassword(newPin);
    user.privateSpacePinHash = newPinHash;
    user.pinResetToken = null;
    user.pinResetExpiresAt = null;
    await user.save();

    // Issue unlocked PIN session cookie
    const pinToken = signPinToken({
      userId: user._id.toString(),
      privateAccess: true,
    });

    const response = NextResponse.json({
      success: true,
      message: "4-Digit PIN reset successfully",
      isUnlocked: true,
    });

    response.cookies.set({
      name: PIN_SESSION_COOKIE_NAME,
      value: pinToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60, // 1 hour
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Reset PIN error:", error);
    return NextResponse.json(
      { error: "Failed to reset PIN" },
      { status: 500 }
    );
  }
}
