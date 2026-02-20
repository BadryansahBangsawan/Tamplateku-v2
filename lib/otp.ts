import bcrypt from "bcryptjs";

export const OTP_PURPOSES = ["REGISTER", "RESET_PASSWORD", "CHANGE_EMAIL"] as const;

export type OtpPurpose = (typeof OTP_PURPOSES)[number];

export const OTP_LENGTH = 6;
export const OTP_EXPIRES_MINUTES = 10;
export const OTP_MAX_ATTEMPTS = 5;

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function generateOtpCode(): string {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  const value = bytes[0] % 1_000_000;
  return value.toString().padStart(OTP_LENGTH, "0");
}

function getOtpPepper(): string {
  const pepper = process.env.OTP_PEPPER;
  if (!pepper || pepper.trim().length < 16) {
    throw new Error("Missing or weak OTP_PEPPER env var (minimum 16 chars).");
  }
  return pepper;
}

function composeOtpMaterial(otp: string, email: string, purpose: OtpPurpose): string {
  return `${otp}:${email}:${purpose}:${getOtpPepper()}`;
}

export async function hashOtpCode(
  otp: string,
  email: string,
  purpose: OtpPurpose
): Promise<string> {
  return bcrypt.hash(composeOtpMaterial(otp, email, purpose), 10);
}

export async function verifyOtpCode(
  otp: string,
  email: string,
  purpose: OtpPurpose,
  otpHash: string
): Promise<boolean> {
  return bcrypt.compare(composeOtpMaterial(otp, email, purpose), otpHash);
}
