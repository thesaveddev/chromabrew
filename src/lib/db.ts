import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function sanitizeUrl(raw: string | undefined): string {
  if (!raw) return "";
  // The pg driver does not support `channel_binding` (SCRAM channel
  // binding).  Neon's pooler URL includes it by default — strip it.
  const url = new URL(raw);
  url.searchParams.delete("channel_binding");
  return url.toString();
}

function createPrismaClient() {
  const connectionString = sanitizeUrl(process.env.DATABASE_URL);
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
