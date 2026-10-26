import { NextResponse } from "next/server";

import { auth } from "@/lib/auth/config";
import { hasEntitlement } from "@/lib/entitlements-server";
import {
  ScheduleError,
  createSchedule,
  listSchedules,
  type ScheduleDto,
} from "@/lib/audit/schedules";
import { ScanRequestError } from "@/lib/audit/runner";
import type { ScanScopeId } from "@/lib/audit/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The owner's watches. Signed in only: a schedule without an owner has
 * nobody to bill, nobody to attribute, and no quota identity.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to manage watched sites." }, { status: 401 });
  }
  const schedules: ScheduleDto[] = await listSchedules(session.user.id);
  return NextResponse.json(
    { schedules },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to watch a site." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Send a JSON body with a url." }, { status: 400 });
  }

  const { url, scope, viewportId, intervalDays } = (body ?? {}) as {
    url?: unknown;
    scope?: ScanScopeId;
    viewportId?: unknown;
    intervalDays?: unknown;
  };

  if (typeof url !== "string" || url.trim() === "") {
    return NextResponse.json({ error: "Enter a website address to watch." }, { status: 400 });
  }
  if (typeof intervalDays !== "number" || !Number.isInteger(intervalDays)) {
    return NextResponse.json({ error: "Choose a re-scan interval." }, { status: 400 });
  }

  try {
    const isPro = await hasEntitlement(session.user.id, "pro");
    const schedule = await createSchedule({
      userId: session.user.id,
      url,
      scope,
      viewportId: typeof viewportId === "string" ? viewportId : undefined,
      intervalDays,
      isPro,
    });
    return NextResponse.json({ schedule }, { status: 201 });
  } catch (error) {
    // Both error types carry messages written to be shown: a plan limit the
    // reader can fix by upgrading, or a URL problem they can fix by editing.
    if (error instanceof ScheduleError || error instanceof ScanRequestError) {
      return NextResponse.json(
        { error: error.message, code: error.code ?? "invalid" },
        { status: 400 },
      );
    }
    console.error("audit schedule create failed", error);
    return NextResponse.json(
      { error: "The schedule could not be created." },
      { status: 500 },
    );
  }
}
