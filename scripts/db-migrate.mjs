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
 * never migrated by Prisma, and whose URL does not name the schema. Three
 * separate failures came out of that, and each one left a rule behind:
 *
 *   1. The history table is found through the *connection*, while `migrate
 *      deploy` looks for it in the schema the datasource declares. With no
 *      `schema=` on the URL, `resolve` recorded the baseline in `public` and the
 *      deploy that followed could not find it (P1014) — so every command below
 *      carries an explicit `schema`, and the history stays where the app's
 *      tables are.
 *   2. The database was built by hand (`psql -f prisma/audit-migration.sql`),
 *      so parts of the history are already in it with no record of who put them
 *      there. Re-running that SQL stops on `CREATE TABLE "Scan"` with "relation
 *      already exists" and records the migration as failed, which then blocks
 *      every later deploy with P3009. So each migration declares the objects it
 *      creates, and one whose objects are all present is *recorded* rather than
 *      replayed.
 *   3. A half-applied migration cannot be resolved by guessing. If some of a
 *      migration's objects exist and others do not, this stops and lists them,
 *      because replaying the SQL would fail and recording it as applied would
 *      claim a schema that is not there.
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
 * The connection string is never printed, and neither is any part of it except
 * the database name, the schema and the host, which is what Prisma prints too.
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
  {
    name: "20261014000000_worker_heartbeat",
    tables: ["WorkerHeartbeat"],
  },
  {
    name: "20261019000000_screenshot_bytes",
    columns: [{ table: "ScannedPage", column: "screenshotData" }],
  },
  {
    name: "20261019000001_gallery_opt_in",
    columns: [{ table: "Project", column: "listedInGallery" }],
  },
  {
    name: "20261020000000_polar_billing",
    tables: ["PolarCustomer", "PolarSubscription", "Entitlement"],
  },
  {
    name: "20261026000000_audit_schedules",
    tables: ["AuditSchedule"],
  },
  {
    name: "20261027000000_project_members",
    tables: ["ProjectMember"],
  },
  {
    name: "20261027000001_schedule_emails",
    columns: [{ table: "AuditSchedule", column: "emailRecipients" }],
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
  tables: [
    "Scan",
    "ScannedPage",
    "Finding",
    "ProposedFix",
    "Preview",
    "Report",
    // Not a report table: it holds the worker's liveness beat, which the web
    // tier reads before it accepts a scan. A deployment missing it answers
    // every audit form with an error instead of a report, so it belongs in the
    // list of objects this step exists to prove are really there.
    "WorkerHeartbeat",
    // Billing reads these locally: the entitlement snapshot every gate checks
    // (src/lib/entitlements-server.ts) plus the records behind the account UI
    // and webhook sync. A build that shipped without them would 500 the first
    // time someone asked what plan they are on.
    "PolarCustomer",
    "PolarSubscription",
    "Entitlement",
    // Scheduled re-scans: the worker loop reads this table every poll, so a
    // deploy missing it turns every poll into an error instead of an audit.
    "AuditSchedule",
    // Team sharing: every project read resolves the caller's membership, so a
    // deploy missing it 404s projects for collaborators instead of sharing them.
    "ProjectMember",
  ],
  columns: [
    { table: "Scan", column: "shareToken" },
    { table: "Scan", column: "sharedAt" },
    { table: "ScannedPage", column: "screenshotData" },
    { table: "Project", column: "listedInGallery" },
    // Emailed scheduled reports: recipient list per watch. A deploy missing
    // it turns every report send into an error instead of an email.
    { table: "AuditSchedule", column: "emailRecipients" },
    // The heartbeat's clean-shutdown mark. A table that exists without it
    // answers "is any worker still beating" by throwing, which is worse than
    // not having the table: the form reports an internal error for a feature
    // that is only meant to be a courtesy.
    { table: "WorkerHeartbeat", column: "stoppedAt" },
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
 * The schema the app's models live in, read from the datasource so this cannot
 * drift from the Prisma schema. A hardcoded copy is one rename away from
 * migrating the wrong place.
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
 * Migrations must not run through a transaction-mode pooler: an advisory lock
 * is held by a server session, and a pooled client can land on a different
 * server session per statement — so `migrate deploy` ends up waiting on a
 * lock no session will ever release for it (P1002, every deploy, forever).
 * Neon exposes the same database on a direct host that is the pooler host
 * without the `-pooler` suffix, so prefer it whenever the URL names one.
 * The app itself keeps using the pooler; this is only for the build step.
 */
function directConnection(connectionString) {
  try {
    const url = new URL(connectionString);
    if (url.hostname.includes("-pooler")) {
      url.hostname = url.hostname.replace("-pooler", "");
      log(`pooler · migrating through the direct host ${url.hostname} instead`);
      return url.toString();
    }
    return connectionString;
  } catch {
    return connectionString;
  }
}

/**
 * The `pg` driver rejects `channel_binding`, which Neon's pooled URL carries by
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
 * The same connection string with an explicit `schema`.
 *
 * The migrations themselves say `SET search_path TO <schema>` and the app's
 * models are all `@@schema("<schema>")`, so naming it on the connection only
 * makes explicit what both of them already assume — and it keeps
 * `_prisma_migrations` in that schema, where `migrate deploy` looks for it.
 */
function withSchema(connectionString, schema) {
  try {
    const url = new URL(connectionString);
    if (!url.searchParams.get("schema")) url.searchParams.set("schema", schema);
    return url.toString();
  } catch {
    return connectionString;
  }
}

/**
 * Run the repository's own Prisma CLI, whatever the platform calls it, against
 * the schema the app uses.
 *
 * Output is captured and echoed rather than inherited so a failure can be read
 * as well as shown — one specific failure is not a failure: `resolve --applied`
 * on a migration the database already records leaves everything exactly as it
 * should be, so it is treated as done. That is what a second deploy of the same
 * commit does, and it must not fail the build.
 */
function prisma(args, databaseUrl) {
  const cli = path.join(ROOT, "node_modules", "prisma", "build", "index.js");
  const command = `prisma ${args.join(" ")}`;
  const result = spawnSync(process.execPath, [cli, ...args], {
    cwd: ROOT,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    encoding: "utf8",
  });

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  if (result.error) {
    fail(`could not run \`${command}\`: ${result.error.message}`);
  }
  if (result.status === 0) return;

  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  if (/P3008/.test(output) || /already recorded as applied/i.test(output)) {
    log("note · the database already records that migration as applied, which is the state we wanted");
    return;
  }

  fail(
    `\`${command}\` exited ${result.status}. The schema was not applied, ` +
      "so this deploy is stopping rather than serving an app whose tables are missing.",
  );
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * A timed-out advisory lock (P1002 + pg_advisory_lock) means another deploy —
 * or a pooled session that has not released yet — is migrating at the same
 * moment, not that the schema is wrong. Retrying a few times with backoff
 * lets the other holder finish instead of failing a build over contention.
 * Anything else still fails fast: only this signature is retried.
 */
function isLockTimeout(output) {
  return /P1002/.test(output) && /pg_advisory_lock/.test(output);
}

async function migrateDeployWithRetry(connection) {
  const cli = path.join(ROOT, "node_modules", "prisma", "build", "index.js");
  for (let attempt = 1; attempt <= 3; attempt++) {
    const result = spawnSync(process.execPath, [cli, "migrate", "deploy"], {
      cwd: ROOT,
      env: { ...process.env, DATABASE_URL: connection },
      encoding: "utf8",
    });
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    if (result.error) {
      fail(`could not run \`prisma migrate deploy\`: ${result.error.message}`);
    }
    if (result.status === 0) return;
    const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
    if (attempt < 3 && isLockTimeout(output)) {
      const waitMs = attempt === 1 ? 15000 : 30000;
      log(`locked · another migrator holds the advisory lock (attempt ${attempt}/3); retrying in ${waitMs / 1000}s`);
      await sleep(waitMs);
      continue;
    }
    fail(
      `\`prisma migrate deploy\` exited ${result.status}. The schema was not applied, ` +
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
    recorded: new Set(
      rows.filter((row) => row.finished_at || row.rolled_back_at).map((row) => row.migration_name),
    ),
    unfinished: rows
      .filter((row) => !row.finished_at && !row.rolled_back_at)
      .map((row) => row.migration_name),
  };
}

/**
 * Schemas, other than the target one, that also hold a migration history.
 *
 * Not an error — a history recorded through a connection that named no schema
 * lands in `public` — but it is worth one line, because it explains why a
 * migration can look unrecorded to this script and recorded to Prisma.
 */
async function otherHistorySchemas(client, schema) {
  const { rows } = await client.query(
    `select table_schema from information_schema.tables
     where table_name = '_prisma_migrations' and table_schema <> $1
     order by table_schema`,
    [schema],
  );
  return rows.map((row) => row.table_schema);
}

/** Which of a migration's objects are in the database, and which are not. */
function describeMigration(migration, objects) {
  const wanted = [
    ...(migration.tables ?? []).map((table) => ({ label: table, present: objects.tables.has(table) })),
    ...(migration.columns ?? []).map((column) => ({
      label: `${column.table}.${column.column}`,
      present: objects.columns.has(`${column.table}.${column.column}`),
    })),
  ];

  return {
    present: wanted.filter((entry) => entry.present).map((entry) => entry.label),
    missing: wanted.filter((entry) => !entry.present).map((entry) => entry.label),
  };
}

/** One line naming everything a refusal was based on, so the log is enough. */
function inventory(schema, objects, history, stray = []) {
  const tables = [...objects.tables].sort();
  return [
    `schema "${schema}" holds ${tables.length} table(s)${tables.length ? `: ${tables.join(", ")}` : ""}`,
    `migration history in "${schema}": ${
      history.recorded.size ? [...history.recorded].sort().join(", ") : "(none)"
    }`,
    stray.length ? `a history also exists in ${stray.map((s) => `"${s}"`).join(", ")}` : "",
  ]
    .filter(Boolean)
    .join("; ");
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
  const connection = withSchema(directConnection(connectionString), schema);
  const client = await connect(connection);

  let objects;
  let history;
  let stray;
  try {
    objects = await readSchemaObjects(client, schema);
    history = await readMigrationHistory(client, schema);
    stray = await otherHistorySchemas(client, schema);
  } finally {
    await client.end();
  }

  if (stray.length > 0) {
    log(
      `note · a migration history also exists in ${stray.map((s) => `"${s}"`).join(", ")}; ` +
        `every command here uses "${schema}", where the app's tables are`,
    );
  }

  // Every row of every history schema, so a blocked build names its blocker
  // in the log rather than only in a Prisma error code.
  const diag = await connect(connection);
  try {
    for (const histSchema of [schema, ...stray]) {
      try {
        const { rows } = await diag.query(
          `select migration_name, started_at, finished_at, rolled_back_at from ` +
            `"${histSchema}"."_prisma_migrations" order by started_at nulls first`,
        );
        for (const r of rows) {
          log(
            `hist ${histSchema} · ${r.migration_name} started=${r.started_at} ` +
              `finished=${r.finished_at ? "yes" : "NULL"} ` +
              `rolled_back=${r.rolled_back_at ? "yes" : "NULL"}`,
          );
        }
      } catch (error) {
        log(`hist ${histSchema} · read failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // A failed row in a *stray* history is still a loaded gun: through the
    // pooled connection Prisma can resolve `_prisma_migrations` in the
    // default schema instead of the target one — the search_path pin rides a
    // session the pooler may not reuse — and the precheck then reports the
    // stray row. That is how a failed `audit_scanning` row from 13 Oct in
    // "public" stopped the 20 Oct deploy with P3009 while every row of the
    // app's own history was clean. The stray history is not the app's, so
    // its dead rows are marked rolled back here, with a schema-qualified
    // UPDATE — the same single-row effect as `migrate resolve --rolled-back`,
    // but aimed at the right table no matter which pooled session answers.
    for (const straySchema of stray) {
      const fixed = await diag.query(
        `update "${straySchema}"."_prisma_migrations"
            set rolled_back_at = now()
          where finished_at is null and rolled_back_at is null
          returning migration_name`,
      );
      for (const row of fixed.rows) {
        log(
          `stray ${straySchema} · ${row.migration_name} failed there long ago and the app's ` +
            `tables live in "${schema}"; marking it rolled back so it cannot block the deploy`,
        );
      }
    }
  } finally {
    await diag.end();
  }

  if (objects.tables.size === 0) {
    log(`fresh database · applying all ${MIGRATIONS.length} migrations to schema "${schema}"`);
  } else {
    const baseline = MIGRATIONS[0];
    if (!history.recorded.has(baseline.name) && describeMigration(baseline, objects).present.length === 0) {
      // Replaying the baseline here would create a second, empty copy of the
      // app's own tables in the schema it queries — which no deploy should do on
      // a guess. A database this shape needs a human deciding what it is.
      fail(
        "the database is not empty but holds none of the baseline's tables, so replaying the " +
          `baseline over it is not something this script will guess at. ${inventory(schema, objects, history, stray)}`,
      );
    }
  }

  for (const name of history.unfinished) {
    // Only the row is in the way: the migration's DDL went with its transaction,
    // so the honest record is "rolled back", and re-running it is what the
    // deploy below does.
    log(`recovering · ${name} is recorded as unfinished, marking it rolled back`);
    prisma(["migrate", "resolve", "--rolled-back", name], connection);
  }

  for (const migration of MIGRATIONS) {
    if (history.recorded.has(migration.name)) continue;

    const { present, missing } = describeMigration(migration, objects);
    if (present.length === 0) continue; // nothing of it is here; the deploy brings all of it

    if (missing.length > 0) {
      // Recording this as applied would claim a schema that is not there, and
      // replaying its SQL would stop on the first object that exists. Neither is
      // a decision to make on someone's production database.
      fail(
        `${migration.name} looks half applied: ${present.join(", ")} exist but ${missing.join(", ")} ` +
          `do not. Resolve it deliberately — either apply what is missing or record it as applied — ` +
          `then deploy again. ${inventory(schema, objects, history, stray)}`,
      );
    }

    // Its objects are all here — applied by hand before the history existed.
    // Recording it runs no SQL, so nothing that exists is touched.
    log(`recording · ${migration.name} is already present but unrecorded, marking it applied`);
    prisma(["migrate", "resolve", "--applied", migration.name], connection);
  }

  await migrateDeployWithRetry(connection);

  // `migrate deploy` succeeded, so its migrations are recorded. This confirms the
  // objects the app will query are really visible in the schema the app uses —
  // the one failure mode this whole step exists to prevent. A part-migrated
  // database passes a table check and still fails on the first scan, which is
  // why columns are checked too.
  const verify = await connect(connection);
  try {
    const after = await readSchemaObjects(verify, schema);
    const missing = [
      ...REQUIRED.tables.filter((table) => !after.tables.has(table)),
      ...REQUIRED.columns
        .filter((column) => !after.columns.has(`${column.table}.${column.column}`))
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
