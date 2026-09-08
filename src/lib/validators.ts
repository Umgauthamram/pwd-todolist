/**
 * Supported email domains for registration and authentication.
 * Includes mail.com, outlook.com, yahoo.com, gmail.com, and major providers.
 */
export const ALLOWED_EMAIL_DOMAINS = [
  "mail.com",
  "outlook.com",
  "yahoo.com",
  "gmail.com",
  "hotmail.com",
  "live.com",
  "icloud.com",
  "proton.me",
  "protonmail.com",
  "zoho.com",
  "aol.com",
  "ymail.com",
] as const;

/**
 * Case-insensitive regular expression validating email with supported domains:
 * - mail.com
 * - outlook.com
 * - yahoo.com / yahoo.co.*
 * - gmail.com
 * - hotmail.com
 * - live.com
 * - icloud.com
 * - proton.me / protonmail.com
 * - zoho.com
 * - aol.com
 * - ymail.com
 */
export const EMAIL_DOMAIN_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@(mail\.com|outlook\.com|yahoo\.(?:com|co\.[a-z]{2})|ymail\.com|gmail\.com|hotmail\.com|live\.com|icloud\.com|proton\.(?:me|com)|protonmail\.com|zoho\.com|aol\.com)$/i;

export const EMAIL_ERROR_MESSAGE =
  "Please use a valid email with a supported domain (e.g., mail.com, outlook.com, yahoo.com, gmail.com, hotmail.com, icloud.com, proton.me).";

/**
 * Validates an email against the domain regex.
 */
export function isValidEmailDomain(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  return EMAIL_DOMAIN_REGEX.test(email.trim());
}
