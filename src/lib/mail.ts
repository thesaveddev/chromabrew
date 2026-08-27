import { Resend } from "resend";

/** Lazy Resend client — only initialized if RESEND_API_KEY is set. */
export function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

const FROM = process.env.EMAIL_FROM ?? "ChromaBrew <onboarding@resend.dev>";
const TO = (process.env.FEEDBACK_NOTIFY_TO ?? "itsopeyemi@gmail.com")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

/**
 * Send a feedback notification email to the configured recipients.
 * Returns early (no throw) when Resend is not configured, so the
 * feedback flow keeps working even before env vars are set.
 */
export async function sendFeedbackEmail(input: {
  type: string;
  message: string;
  email?: string | null;
  page?: string | null;
  ip?: string | null;
}): Promise<boolean> {
  const resend = getResend();
  if (!resend || TO.length === 0) return false;

  const typeLabel = input.type.charAt(0).toUpperCase() + input.type.slice(1);

  try {
    await resend.emails.send({
      from: FROM,
      to: TO,
      subject: `[ChromaBrew] New ${typeLabel.toLowerCase()} feedback`,
      text: [
        `Type: ${typeLabel}`,
        input.page ? `Page: ${input.page}` : null,
        input.email ? `Reporter: ${input.email}` : null,
        input.ip ? `IP: ${input.ip}` : null,
        "",
        "Message:",
        input.message,
      ]
        .filter(Boolean)
        .join("\n"),
    });
    return true;
  } catch {
    return false;
  }
}
