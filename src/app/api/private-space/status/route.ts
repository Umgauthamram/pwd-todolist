import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import User from "@/models/User";
import { getAuthUserFromRequest, getPinSessionFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUserFromRequest(request);
    if (!authUser) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    await connectToDatabase();

    const user = await User.findById(authUser.userId).select("privateSpacePinHash");
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const pinSession = await getPinSessionFromRequest(request);
    const isUnlocked = Boolean(
      pinSession && pinSession.userId === authUser.userId && pinSession.privateAccess
    );

    return NextResponse.json({
      hasPin: Boolean(user.privateSpacePinHash),
      isUnlocked,
    });
  } catch (error) {
    console.error("Private space status error:", error);
    return NextResponse.json(
      { error: "Failed to check status" },
      { status: 500 }
    );
  }
}
