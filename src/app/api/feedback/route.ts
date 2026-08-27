import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { sendFeedbackEmail } from "@/lib/mail";

export async function POST(request: Request) {
  const body = await request.json();
  const { type, message, email, page } = body as {
    type?: "comment" | "bug" | "feature" | "praise";
    message: string;
    email?: string;
    page?: string;
  };

  if (!message || message.trim().length === 0) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  if (message.length > 2000) {
    return NextResponse.json({ error: "Message too long (max 2000 chars)" }, { status: 400 });
  }

  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? null;

  await prisma.feedback.create({
    data: {
      type: type ?? "comment",
      message: message.trim(),
      email: email?.trim() ?? null,
      page: page?.trim() ?? null,
      ip,
    },
  });

  // Notify by email (no-op until RESEND_API_KEY is configured).
  try {
    await sendFeedbackEmail({
      type: type ?? "comment",
      message: message.trim(),
      email: email?.trim(),
      page: page?.trim(),
      ip,
    });
  } catch {
    // Email is best-effort; never fail the request because of it.
  }

  return NextResponse.json({ ok: true });
}
