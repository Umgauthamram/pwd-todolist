import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import User from "@/models/User";
import {
  getAuthUserFromRequest,
  hashPassword,
  signPinToken,
  PIN_SESSION_COOKIE_NAME,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUserFromRequest(request);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { pin, confirmPin } = body;

    if (!pin || typeof pin !== "string" || !/^\d{4}$/.test(pin)) {
      return NextResponse.json(
        { error: "PIN must be exactly 4 numeric digits" },
        { status: 400 }
      );
    }

    if (confirmPin && pin !== confirmPin) {
      return NextResponse.json(
        { error: "PIN confirmation does not match" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const user = await User.findById(authUser.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const pinHash = await hashPassword(pin);
    user.privateSpacePinHash = pinHash;
    await user.save();

    // Auto-unlock the Private Space session upon setup (1-hour expiry)
    const pinToken = signPinToken({
      userId: user._id.toString(),
      privateAccess: true,
    });

    const response = NextResponse.json({
      success: true,
      message: "4-Digit PIN configured successfully",
      hasPin: true,
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
    console.error("Setup PIN error:", error);
    return NextResponse.json(
      { error: "Failed to configure 4-digit PIN" },
      { status: 500 }
    );
  }
}
