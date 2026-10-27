import { NextResponse } from "next/server";

import { auth } from "@/lib/auth/config";
import { hasEntitlement } from "@/lib/entitlements-server";
import {
  ScheduleError,
  deleteSchedule,
  setScheduleActive,
  setScheduleRecipients,
} from "@/lib/audit/schedules";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

async function ownerId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

/**
 * Pause or resume a watch (reactivating restarts its interval from now),
 * or set its emailed-report recipients. One body, one concern: a request
 * carries either `active` or `emailRecipients`, never both.
 */
export async function PATCH(request: Request, { params }: Params) {
  const userId = await ownerId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in to manage watched sites." }, { status: 401 });
  }
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Send a JSON body." }, { status: 400 });
  }
  const { active, emailRecipients } = (body ?? {}) as {
    active?: unknown;
    emailRecipients?: unknown;
  };

  try {
    if (typeof active === "boolean" && emailRecipients === undefined) {
      const schedule = await setScheduleActive(userId, id, active);
      return NextResponse.json({ schedule });
    }
    if (emailRecipients !== undefined && active === undefined) {
      const isPro = await hasEntitlement(userId, "pro");
      const schedule = await setScheduleRecipients({ userId, id, emailRecipients, isPro });
      return NextResponse.json({ schedule });
    }
    return NextResponse.json(
      { error: "Send either active or emailRecipients." },
      { status: 400 },
    );
  } catch (error) {
    if (error instanceof ScheduleError) {
      const status = error.code === "not_found" ? 404 : 400;
      return NextResponse.json({ error: error.message, code: error.code }, { status });
    }
    console.error("audit schedule update failed", error);
    return NextResponse.json(
      { error: "The schedule could not be updated." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const userId = await ownerId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in to manage watched sites." }, { status: 401 });
  }
  const { id } = await params;

  try {
    await deleteSchedule(userId, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ScheduleError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 404 });
    }
    console.error("audit schedule delete failed", error);
    return NextResponse.json(
      { error: "The schedule could not be deleted." },
      { status: 500 },
    );
  }
}
