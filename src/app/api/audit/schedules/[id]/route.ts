import { NextResponse } from "next/server";

import { auth } from "@/lib/auth/config";
import {
  ScheduleError,
  deleteSchedule,
  setScheduleActive,
} from "@/lib/audit/schedules";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

async function ownerId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

/** Pause or resume a watch. Reactivating restarts its interval from now. */
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
    return NextResponse.json({ error: "Send a JSON body with active." }, { status: 400 });
  }
  const { active } = (body ?? {}) as { active?: unknown };
  if (typeof active !== "boolean") {
    return NextResponse.json({ error: "Send active as true or false." }, { status: 400 });
  }

  try {
    const schedule = await setScheduleActive(userId, id, active);
    return NextResponse.json({ schedule });
  } catch (error) {
    if (error instanceof ScheduleError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 404 });
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
