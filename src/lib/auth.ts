import bcrypt from "bcryptjs";
import jwt, { JwtPayload } from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-beginning-notes-app-2026";
export const AUTH_COOKIE_NAME = "beginning_auth_token";
export const PIN_SESSION_COOKIE_NAME = "beginning_pin_session";

export interface AuthUserToken {
  userId: string;
  email: string;
}

export interface PinSessionToken {
  userId: string;
  privateAccess: boolean;
}

/**
 * Hash a plain text password or PIN with salt rounds.
 */
export async function hashPassword(plainText: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainText, salt);
}

/**
 * Compare plain text against hashed string.
 */
export async function comparePassword(plainText: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainText, hash);
}

/**
 * Sign JWT token for user session (expires in 7 days).
 */
export function signAuthToken(payload: AuthUserToken): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

/**
 * Verify JWT token and return decoded payload.
 */
export function verifyAuthToken(token: string): AuthUserToken | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload & AuthUserToken;
    if (decoded && decoded.userId && decoded.email) {
      return {
        userId: decoded.userId,
        email: decoded.email,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Sign short-lived PIN session token for Private Space (expires in 1 hour).
 */
export function signPinToken(payload: PinSessionToken): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
}

/**
 * Verify PIN session token.
 */
export function verifyPinToken(token: string): PinSessionToken | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload & PinSessionToken;
    if (decoded && decoded.userId && decoded.privateAccess) {
      return {
        userId: decoded.userId,
        privateAccess: decoded.privateAccess,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Extract authenticated user from Incoming Request cookies.
 */
export async function getAuthUserFromRequest(request?: NextRequest): Promise<AuthUserToken | null> {
  let token: string | undefined;

  if (request) {
    token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  } else {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    } catch {
      return null;
    }
  }

  if (!token) return null;
  return verifyAuthToken(token);
}

/**
 * Generate a random 6-digit numeric OTP string.
 */
export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
