import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import User from "@/models/User";
import {
  getAuthUserFromRequest,
  comparePassword,
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
    const { pin } = body;

    if (!pin || typeof pin !== "string" || !/^\d{4}$/.test(pin)) {
      return NextResponse.json(
        { error: "PIN must be 4 digits" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const user = await User.findById(authUser.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.privateSpacePinHash) {
      return NextResponse.json(
        { error: "No 4-digit PIN configured. Please set up a PIN first.", requiresSetup: true },
        { status: 400 }
      );
    }

    const isMatch = await comparePassword(pin, user.privateSpacePinHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Incorrect PIN. Please try again." },
        { status: 401 }
      );
    }

    // Sign PIN session token (1 hour)
    const pinToken = signPinToken({
      userId: user._id.toString(),
      privateAccess: true,
    });

    const response = NextResponse.json({
      success: true,
      message: "Private Space unlocked",
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
    console.error("Verify PIN error:", error);
    return NextResponse.json(
      { error: "Failed to verify PIN" },
      { status: 500 }
    );
  }
}
