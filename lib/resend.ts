import { Resend } from "resend";

let resendClient: Resend | null = null;

export function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
}

export const resendDefaults = {
  from: process.env.RESEND_FROM_EMAIL ?? "consultas@meruviajes.tur.ar",
  to: process.env.RESEND_TO_EMAIL ?? "info@meruviajes.tur.ar",
};
