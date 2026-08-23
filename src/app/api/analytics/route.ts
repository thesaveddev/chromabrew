import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const { path } = body as { path: string };

  if (!path) {
    return NextResponse.json({ error: "path is required" }, { status: 400 });
  }

  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? null;
  const userAgent = request.headers.get("user-agent") ?? null;
  const referrer = request.headers.get("referer") ?? null;

  // Sample 1 in 10 page views to keep DB small
  if (Math.random() > 0.1) {
    return NextResponse.json({ ok: true, sampled: false });
  }

  await prisma.pageView.create({
    data: { path, ip, userAgent, referrer },
  });

  return NextResponse.json({ ok: true, sampled: true });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") ?? "7");
  const since = new Date();
  since.setDate(since.getDate() - days);

  const views = await prisma.pageView.groupBy({
    by: ["path"],
    _count: { id: true },
    where: { createdAt: { gte: since } },
    orderBy: { _count: { id: "desc" } },
    take: 20,
  });

  const daily = await prisma.$queryRaw<{ date: string; count: bigint }[]>`
    SELECT DATE(created_at) as date, COUNT(*) as count
    FROM "PageView"
    WHERE created_at >= ${since}
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `;

  return NextResponse.json({
    totalViews: views.reduce((sum, v) => sum + Number(v._count.id), 0),
    topPages: views.map((v) => ({ path: v.path, views: Number(v._count.id) })),
    daily: daily.map((d) => ({ date: d.date, views: Number(d.count) })),
  });
}
