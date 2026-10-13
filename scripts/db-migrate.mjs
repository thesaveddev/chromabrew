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
 * The hard part is not running migrations; it is reading a database that was
 * never migrated by Prisma. This project's production database predates
 * `prisma/migrations/` and was built by hand — first with the pre-audit schema,
 * later with `psql -f prisma/audit-migration.sql` — so parts of the history are
 * already sitting in that database with no record of who put them there:
 *
 *   baseline            recorded,  tables present        -> nothing to do
 *   audit_scanning      unrecorded, tables present       -> record it, do not replay it
 *   share_reports       unrecorded, columns absent       -> apply it
 *
 * Replaying the second row's SQL is what a bare `prisma migrate deploy` does,
 * and it stops on the first `CREATE TABLE "Scan"` with "relation already
 * exists", leaving the migration recorded as failed — which then blocks every
 * later migration (and so every later deploy) with P3009 until someone resolves
 * it. So each migration declares the objects it creates, and a database that
 * already has them is *recorded* rather than re-run. A migration left failed by
 * an interrupted attempt is rolled back first, for the same reason: its DDL
 * went with the transaction, and its row is the only thing still in the way.
 *
 * Nothing in this file is destructive. Every path is one of three things:
 * `migrate resolve` (one INSERT or one UPDATE to `_prisma_migrations`),
 * `migrate deploy` (only migrations not yet recorded), or a read.
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

/**
 * The history, oldest first, and the objects each migration creates.
 *
 * A migration whose objects are all present is recorded as applied instead of
 * being replayed. The markers are deliberately the tables and columns the app
 * queries, not a checksum: this asserts what a deploy actually needs, and it
 * does not care about the unrelated differences a hand-managed database has
 * accumulated over the years.
 */
const MIGRATIONS = [
  {
    name: "20261011000000_baseline",
    /** Everything that predates auditing, created by hand long before Prisma. */
    tables: ["User", "Account", "Session", "VerificationToken", "Project"],
  },
  {
    name: "20261012000000_audit_scanning",
    tables: ["Scan", "ScannedPage", "Finding", "ProposedFix", "Preview", "Report"],
  },
  {
    name: "20261013000000_share_reports",
    columns: [
      { table: "Scan", column: "shareToken" },
      { table: "Scan", column: "sharedAt" },
    ],
  },
];

/**
 * What a deployed app must be able to query. Checked by name rather than with
 * `prisma migrate diff`, which would also report every unrelated difference
 * between an old hand-managed database and `schema.prisma` — legacy columns or
 * leftovers would fail every build for reasons the audit feature has nothing to
 * do with. This asserts what the app actually needs, including the share
 * columns: without them every scan fails with
 * `The column Scan.shareToken does not exist in the current database`.
 */
const REQUIRED = {
  tables: ["Scan", "ScannedPage", "Finding", "ProposedFix", "Preview", "Report"],
  columns: [
    { table: "Scan", column: "shareToken" },
    { table: "Scan", column: "sharedAt" },
  ],
};

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

async function connect(connectionString) {
  const client = new pg.Client({ connectionString: sanitize(connectionString) });
  try {
    await client.connect();
  } catch (error) {
    // Unreachable is not the same as "nothing to do": carrying on would build a
    // deploy against a database whose state is unknown.
    fail(`cannot reach the database: ${error instanceof Error ? error.message : String(error)}`);
  }
  return client;
}

/** Every table and column in the target schema, as `table` and `table.column`. */
async function readSchemaObjects(client, schema) {
  const [tables, columns] = await Promise.all([
    client.query(
      `select table_name from information_schema.tables
       where table_schema = $1 and table_type = 'BASE TABLE'`,
      [schema],
    ),
    client.query(
      `select table_name, column_name from information_schema.columns where table_schema = $1`,
      [schema],
    ),
  ]);

  return {
    tables: new Set(tables.rows.map((row) => row.table_name)),
    columns: new Set(columns.rows.map((row) => `${row.table_name}.${row.column_name}`)),
  };
}

/**
 * What `_prisma_migrations` says, or nothing at all when the table is absent —
 * which is the normal case for a database Prisma has never migrated.
 *
 * A row with no `finished_at` and no `rolled_back_at` is a migration that began
 * and did not finish. Its DDL was rolled back with the transaction, but the row
 * it left behind blocks every later migration until it is resolved.
 */
async function readMigrationHistory(client, schema) {
  const hasHistory = await client.query(
    `select 1 from information_schema.tables
     where table_schema = $1 and table_name = '_prisma_migrations'`,
    [schema],
  );
  if (hasHistory.rowCount === 0) return { recorded: new Set(), unfinished: [] };

  const { rows } = await client.query(
    `select migration_name, finished_at, rolled_back_at
     from "${schema}"."_prisma_migrations"`,
  );

  return {
    recorded: new Set(rows.filter((row) => row.finished_at || row.rolled_back_at).map((row) => row.migration_name)),
    unfinished: rows
      .filter((row) => !row.finished_at && !row.rolled_back_at)
      .map((row) => row.migration_name),
  };
}

/** True when every object a migration creates is already in the database. */
function alreadyPresent(migration, objects) {
  const tables = (migration.tables ?? []).every((table) => objects.tables.has(table));
  const columns = (migration.columns ?? []).every((column) =>
    objects.columns.has(`${column.table}.${column.column}`),
  );
  return tables && columns;
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
  const client = await connect(connectionString);

  try {
    const objects = await readSchemaObjects(client, schema);
    const history = await readMigrationHistory(client, schema);

    if (objects.tables.size === 0) {
      log(`fresh database · applying all ${MIGRATIONS.length} migrations to schema "${schema}"`);
    }

    for (const name of history.unfinished) {
      // Only the row is in the way: the migration's DDL went with its
      // transaction, so the honest record is "rolled back", and re-running it is
      // what the deploy below does.
      log(`recovering · ${name} is recorded as unfinished, marking it rolled back`);
      prisma(["migrate", "resolve", "--rolled-back", name]);
    }

    for (const migration of MIGRATIONS) {
      if (history.recorded.has(migration.name)) continue;
      if (!alreadyPresent(migration, objects)) continue;
      // Its objects are already here — applied by hand before the history
      // existed. Recording it runs no SQL, so nothing that exists is touched.
      log(`recording · ${migration.name} is already present but unrecorded, marking it applied`);
      prisma(["migrate", "resolve", "--applied", migration.name]);
    }
  } finally {
    await client.end();
  }

  prisma(["migrate", "deploy"]);

  // `migrate deploy` succeeded, so its migrations are recorded. This confirms the
  // objects the app will query are really visible in the schema the app uses —
  // the one failure mode this whole step exists to prevent. A part-migrated
  // database passes a table check and still fails on the first scan, which is
  // why columns are checked too.
  const verify = await connect(connectionString);
  try {
    const objects = await readSchemaObjects(verify, schema);
    const missing = [
      ...REQUIRED.tables.filter((table) => !objects.tables.has(table)),
      ...REQUIRED.columns
        .filter((column) => !objects.columns.has(`${column.table}.${column.column}`))
        .map((column) => `${column.table}.${column.column}`),
    ];

    if (missing.length > 0) {
      fail(
        `migrations reported success but ${missing.join(", ")} ${missing.length === 1 ? "is" : "are"} ` +
          `missing from schema "${schema}". The app would fail on its first query.`,
      );
    }
  } finally {
    await verify.end();
  }

  log(`ready · ${REQUIRED.tables.length} audit tables and the share columns are present in "${schema}"`);
}

await main();
