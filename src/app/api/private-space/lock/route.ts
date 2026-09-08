import { NextResponse } from "next/server";
import { PIN_SESSION_COOKIE_NAME } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: "Private Space locked",
    isUnlocked: false,
  });

  response.cookies.set({
    name: PIN_SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    expires: new Date(0),
    path: "/",
  });

  return response;
}
