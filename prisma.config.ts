import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // env() throws if the var is missing, which breaks `prisma generate`
    // on CI where DATABASE_URL isn't set yet. Read directly with a fallback.
    url: process.env.DATABASE_URL ?? "postgresql://localhost:5432/dummy",
  },
});
