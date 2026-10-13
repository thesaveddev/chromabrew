#!/usr/bin/env node
/**
 * Apply the database schema during a production build.
 *
 * The app and its database must never disagree about whether the audit tables
 * exist, and that is exactly what went wrong: the schema lived in a migration
 * history nobody ran, so the first real scan died with
 * `The table chromabrew.Scan does not exist in the current database`.
 *
 * So the build owns it. `npm run build` runs this between `prisma generate` and
 * `next build`, which means a deploy refuses to ship code whose schema is not
 * there — fail closed, rather than shipping 500s and finding out from a user.
 *
 * Three database states have to work, and only the first is the happy one:
 *
 *   fresh      no schema at all                  -> deploy creates everything
 *   existing   tables but no migration history   -> record the baseline, then deploy
 *   managed    `_prisma_migrations` present      -> deploy what is pending
 *
 * The middle state is the production database: it predates `prisma/migrations/`
 * entirely, because the schema was created by hand. `prisma migrate deploy`
 * refuses such a database with P3005, and its refusal is right — it cannot know
 * whether those tables match the baseline migration. Recording the baseline as
 * applied is the answer Prisma documents for exactly this: it writes a single
 * row to `_prisma_migrations` and runs no SQL, so no existing table or row is
 * touched. The deploy afterwards applies only the genuine deltas, all of which
 * are additive.
 *
 * Nothing in this file is destructive. Every path is one of three things:
 * `migrate resolve --applied` (one INSERT), `migrate deploy` (only migrations
 * not yet recorded), or a read.
 *
 * Environment:
 *   DATABASE_URL      the connection string; without it the step is skipped
 *   VERCEL_ENV        `production` enables the step, so previews do not migrate
 *   RUN_DB_MIGRATE=1  force it on anywhere else (how this script is tested)
 *
 * As in `scripts/audit-worker.mjs`, the process environment wins and anything
 * missing is filled from `.env.local` / `.env` in the repository root. That is
 * what makes the runbook's command work on the host in
 * `docs/AUDIT_WORKER_HOST.md`, which keeps its credentials in a populated
 * `.env`: without the fallback the documented upgrade step would print
 * "skipped · DATABASE_URL is not set" and migrate nothing.
 *
 * The connection string is never printed. Prisma's own output for a migration
 * is limited to the database name, the schema and the host.
 */

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** The migration that describes everything which predates the audit work. */
const BASELINE = "20261011000000_baseline";

/**
 * The tables a deployed app must be able to query.
 *
 * Checked by name rather than with `prisma migrate diff`, which would also
 * report every unrelated difference between an old hand-managed database and
 * `schema.prisma` — legacy columns or leftovers would fail every build for
 * reasons the audit feature has nothing to do with. This asserts what the app
 * actually needs.
 */
const REQUIRED_TABLES = ["Scan", "ScannedPage", "Finding", "ProposedFix", "Preview", "Report"];

function log(message) {
  process.stdout.write(`db-migrate ${message}\n`);
}

function fail(message) {
  process.stderr.write(`db-migrate ERROR ${message}\n`);
  process.exit(1);
}

/**
 * The schema name, read from the datasource so this cannot drift from the
 * Prisma schema. A hardcoded copy is one rename away from migrating the wrong
 * place.
 */
function readSchemaName() {
  const schemaPath = path.join(ROOT, "prisma", "schema.prisma");
  let text;
  try {
    text = readFileSync(schemaPath, "utf8");
  } catch {
    fail(`could not read ${schemaPath}`);
  }

  const match = /schemas\s*=\s*\[([^\]]*)\]/.exec(text);
  const name = match ? /["']([^"']+)["']/.exec(match[1])?.[1] : null;
  if (!name) {
    fail("the datasource declares no `schemas = [...]`, so the target schema is unknown.");
  }
  return name;
}

/**
 * The pg driver rejects `channel_binding`, which Neon's pooled URL carries by
 * default — the same reason `src/lib/db.ts` strips it for the app.
 */
function sanitize(connectionString) {
  try {
    const url = new URL(connectionString);
    url.searchParams.delete("channel_binding");
    return url.toString();
  } catch {
    return connectionString;
  }
}

/**
 * Fill missing variables from the repo's env files. Never overwrite the process
 * environment — the same rule the worker follows, so a value passed on the
 * command line or by systemd is the one that is used.
 */
async function loadEnvFiles() {
  for (const file of [".env.local", ".env"]) {
    let text;
    try {
      text = await readFile(path.join(ROOT, file), "utf8");
    } catch {
      continue;
    }
    for (const line of text.split("\n")) {
      // The trailing `\r` of a CRLF file has to go first: `.` does not match it,
      // so `$` cannot sit before it and *every* line of an `.env` written on
      // Windows is skipped in silence. This is how the documented upgrade
      // command managed to report "DATABASE_URL is not set" on a host whose
      // `.env` was full of it.
      const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line.replace(/\r$/, ""));
      if (!match) continue;
      const [, key, raw] = match;
      if (process.env[key] !== undefined) continue;
      let value = raw.trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (value.length > 0) process.env[key] = value;
    }
  }
}

/** Run the repository's own Prisma CLI, whatever the platform calls it. */
function prisma(args) {
  const cli = path.join(ROOT, "node_modules", "prisma", "build", "index.js");
  const result = spawnSync(process.execPath, [cli, ...args], {
    cwd: ROOT,
    stdio: "inherit",
  });

  if (result.error) {
    fail(`could not run \`prisma ${args.join(" ")}\`: ${result.error.message}`);
  }
  if (result.status !== 0) {
    fail(
      `\`prisma ${args.join(" ")}\` exited ${result.status}. The schema was not applied, ` +
        "so this deploy is stopping rather than serving an app whose tables are missing.",
    );
  }
}

/** How far along the database is, without assuming anything about it. */
async function inspect(client, schema) {
  const { rows } = await client.query(
    `select
       exists(select 1 from information_schema.schemata where schema_name = $1) as has_schema,
       exists(
         select 1 from information_schema.tables
         where table_schema = $1 and table_name = '_prisma_migrations'
       ) as has_history,
       (
         select count(*) from information_schema.tables
         where table_schema = $1 and table_name <> '_prisma_migrations'
       ) as tables`,
    [schema],
  );

  const row = rows[0] ?? {};
  return {
    hasSchema: row.has_schema === true,
    hasHistory: row.has_history === true,
    tables: Number(row.tables ?? 0),
  };
}

/** The tables the app will query, once the migrations are done. */
async function presentTables(client, schema) {
  const { rows } = await client.query(
    `select table_name from information_schema.tables
     where table_schema = $1 and table_name = any($2::text[])`,
    [schema, REQUIRED_TABLES],
  );
  return new Set(rows.map((row) => row.table_name));
}

async function main() {
  await loadEnvFiles();

  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    log("skipped · DATABASE_URL is not set");
    return;
  }

  // Preview deployments share the production database here, and a preview build
  // has no business migrating it — one migrator, on the deploy that matters.
  const enabled = process.env.RUN_DB_MIGRATE === "1" || process.env.VERCEL_ENV === "production";
  if (!enabled) {
    log("skipped · not a production deploy (set RUN_DB_MIGRATE=1 to force)");
    return;
  }

  const schema = readSchemaName();
  const client = new pg.Client({ connectionString: sanitize(connectionString) });

  try {
    await client.connect();
  } catch (error) {
    // Unreachable is not the same as "nothing to do": carrying on would build a
    // deploy against a database whose state is unknown.
    fail(`cannot reach the database: ${error instanceof Error ? error.message : String(error)}`);
  }

  try {
    const before = await inspect(client, schema);

    if (!before.hasSchema || before.tables === 0) {
      log(`fresh database · applying all migrations to schema "${schema}"`);
    } else if (!before.hasHistory) {
      log(
        `existing database · ${before.tables} table(s) in "${schema}" with no migration ` +
          `history, so the baseline is being recorded before the deltas are applied`,
      );
      // Records the baseline; runs no SQL. Existing tables and rows are untouched.
      prisma(["migrate", "resolve", "--applied", BASELINE]);
    } else {
      log(`managed database · applying anything pending in schema "${schema}"`);
    }
  } finally {
    await client.end();
  }

  prisma(["migrate", "deploy"]);

  // `migrate deploy` succeeded, so its migrations are recorded. This confirms the
  // tables the app will query are really visible in the schema the app uses —
  // the one failure mode this whole step exists to prevent.
  const verify = new pg.Client({ connectionString: sanitize(connectionString) });
  await verify.connect();
  try {
    const present = await presentTables(verify, schema);
    const missing = REQUIRED_TABLES.filter((table) => !present.has(table));
    if (missing.length > 0) {
      fail(
        `migrations reported success but ${missing.join(", ")} ${missing.length === 1 ? "is" : "are"} ` +
          `missing from schema "${schema}". The app would fail on its first query.`,
      );
    }
  } finally {
    await verify.end();
  }

  log(`ready · ${REQUIRED_TABLES.length} audit tables present in schema "${schema}"`);
}

await main();
