import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { normalizeUrl } from "@/lib/audit/url-validator";

export async function POST(req: Request) {
  try {
    const { url, scope = "single_page", viewportWidth = 1280, viewportHeight = 720 } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const normalized = normalizeUrl(url);
    const session = await auth();

    const scan = await prisma.scan.create({
      data: {
        url,
        normalizedUrl: normalized,
        scope: scope as any,
        viewportWidth,
        viewportHeight,
        userId: session?.user?.id ?? null,
      },
    });

    return NextResponse.json({ scanId: scan.id, status: scan.status }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create scan";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
