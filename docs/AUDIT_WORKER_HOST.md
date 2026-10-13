# Running the audit worker on a VPS

How to run the Stage 2 browser worker — the process that renders pages,
runs axe-core in them, measures contrast, captures screenshots and writes the
findings. Architecture and analysis logic: `docs/AUDIT_ARCHITECTURE.md`.

The worker is `scripts/audit-worker.mjs`. It polls the `Scan` table, claims the
oldest `queued` row, and drives it to a terminal state. Claiming is a
conditional update, so running two workers is safe; one is enough for now.

## 1. Why it cannot run inside the Vercel app

- **Browser binaries.** The renderer is Playwright's Chromium. It cannot be
  installed into a serverless function image and would exceed the bundle limit.
- **Execution ceiling.** `POST /api/audit/scan` declares `maxDuration = 60`, and
  a real page render plus axe-core plus a screenshot takes tens of seconds. A
  scan must be able to outlive the request that created it, which is the whole
  point of the queue.
- **Filesystem.** Screenshots are written to disk. A serverless filesystem is
  ephemeral, so the image a report links to would disappear.
- **Concurrency and abuse.** The worker renders untrusted third-party
  JavaScript; that must happen on infrastructure with a fixed egress policy and
  a process the project controls.

The web app does not need the worker to serve reports — it only reads rows. The
worker needs the database and a writable screenshot directory.## 2. No app-side kick (checked)

Earlier drafts had `POST /api/audit/scan` start the work itself with
`after(() => runScan(id))`. That is gone: `src/app/api/audit/scan/route.ts` only
validates the body, writes a `queued` row and returns `{ id, status, stage }`.
Nothing in the app claims scans, so the worker is the only thing that processes
them and no report can be quietly degraded to the fetch pipeline by the web tier.

If a kick is ever added back for local development, gate it on
`NODE_ENV !== "production"` **and** on the worker not being configured — otherwise
a freshly installed worker looks idle while scans report `renderMode: "fetch"`.

## 3. Install on Debian/Ubuntu

```bash
# Node 20.6+ is required (22 LTS recommended) — the worker loads TypeScript
# modules through the tsx loader, and `module.register()` needs 20.6+.
node --version

sudo useradd --system --create-home --shell /usr/sbin/nologin chromabrew-worker
sudo mkdir -p /srv/chromabrew /var/lib/chromabrew/screenshots
sudo chown -R chromabrew-worker:chromabrew-worker /srv/chromabrew /var/lib/chromabrew

cd /srv/chromabrew
git clone https://github.com/thesaveddev/chromabrew.git .
# Pin a commit or tag rather than tracking the branch: a restart should not
# silently pick up half-finished work.
git checkout <release-tag-or-commit>

# Playwright and tsx are devDependencies, so a plain `npm ci --omit=dev` would
# remove exactly what the worker needs. Install with dev dependencies included
# (or promote both to `dependencies` in package.json and install that way).
npm ci --include=dev
npx playwright install --with-deps chromium

# Database schema — see §5. This host runs no web build, so apply it directly:
#   RUN_DB_MIGRATE=1 node scripts/db-migrate.mjs
# It records the baseline first on a database that has tables but no migration
# history (a bare `prisma migrate deploy` stops there with P3005) and then
# deploys the deltas.
npx prisma generate
```

Environment file — `/etc/chromabrew/audit-worker.env`, mode `0640`, owned by
`root:chromabrew-worker`:

```bash
DATABASE_URL="postgresql://user:password@127.0.0.1:5432/chromabrew?schema=chromabrew"
AUDIT_SCREENSHOT_DIR="/var/lib/chromabrew/screenshots"
NODE_ENV=production
```

Only `DATABASE_URL` is required. The worker reads the process environment first
and then `.env.local` / `.env` in the repository root, so a VPS that already has
a populated `.env` needs no environment file.

The `schema=` parameter is not decoration. The datasource declares
`schemas = ["chromabrew"]` and every model is `@@schema("chromabrew")`, so
pointing it at `public` does create the schema but then fails the first
migration with `P1014`, looking for `_prisma_migrations` in the wrong place.

## 4. Run it

```bash
cd /srv/chromabrew
# `--import tsx` is required, not optional: the analysis modules are TypeScript
# and import through the `@/` alias, and tsx 4.7+ refuses the old in-process
# `module.register("tsx/esm")` route with "tsx must be loaded with --import
# instead of --loader". `npm run audit:worker` is the same command.
sudo -u chromabrew-worker --preserve-env=DATABASE_URL \
  node --import tsx scripts/audit-worker.mjs
```

A healthy start prints one line and then heartbeats while idle:

```
2026-10-11T22:50:03.481Z audit-worker ready · node 22.11.0 · screenshots /var/lib/chromabrew/screenshots · poll 1000-15000ms
2026-10-11T22:51:03.488Z audit-worker idle · queue empty · uptime 60.0s
2026-10-11T22:52:41.220Z audit-worker scan cmv4f0a1b90000qwerty completed (browser) in 8.4s
```

It exits non-zero, before claiming anything, if `DATABASE_URL` is missing, if the
`tsx` loader cannot load the analysis modules, if no browser renderer is available
(a worker without Chromium would complete every scan in degraded fetch mode), or
if `AUDIT_SCREENSHOT_DIR` is not writable. Each of those is one line of output
naming the fix — never a stack trace.
`SIGTERM`/`SIGINT` stops claiming new work, lets the in-flight scan finish, and
exits 0; a second signal exits immediately, and the interrupted scan is closed
as failed by `recoverStaleScans()` the next time a worker polls.

### systemd

`/etc/systemd/system/chromabrew-audit-worker.service`:

```ini
[Unit]
Description=ChromaBrew audit worker (Playwright renderer)
After=network-online.target postgresql.service
Wants=network-online.target

[Service]
Type=simple
User=chromabrew-worker
Group=chromabrew-worker
WorkingDirectory=/srv/chromabrew
EnvironmentFile=/etc/chromabrew/audit-worker.env
ExecStart=/usr/bin/node --import tsx scripts/audit-worker.mjs
Restart=always
RestartSec=10
# A configuration error (no DATABASE_URL, no browser) exits immediately; do not
# let that become a hot restart loop.
StartLimitIntervalSec=300
StartLimitBurst=5
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/lib/chromabrew/screenshots
MemoryMax=2G
LimitNOFILE=8192

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now chromabrew-audit-worker
journalctl -u chromabrew-audit-worker -f
```

pm2 alternative:

```bash
pm2 start "node --import tsx scripts/audit-worker.mjs" --name chromabrew-audit-worker --time
# pm2 needs the interpreter to be the one from this checkout, so on a host with
# several Node versions use the absolute path: /usr/bin/node --import tsx …
pm2 save && pm2 startup
```

## 5. Database prerequisite

The audit tables (`Scan`, `ScannedPage`, `Finding`, `ProposedFix`, `Preview`,
`Report`) must exist before the first run. `prisma/migrations/` carries the
history:

| Migration | What it creates |
| --------- | --------------- |
| `20261011000000_baseline` | Everything that predates auditing — user, account, session, project, feedback, page view and subscription tables |
| `20261012000000_audit_scanning` | The six audit tables, their indexes and foreign keys |
| `20261013000000_share_reports` | The two share columns on `Scan` |

**The web deploy applies these for you.** `npm run build` runs
`scripts/db-migrate.mjs` between `prisma generate` and `next build`, so a deploy
cannot ship code whose tables are missing — it stops before `next build` rather
than serving `500`s and finding out from a user.

The script reads the schema name from `prisma/schema.prisma` and asks the
database what has already happened. Each migration declares the objects it
creates, so a database that already has them is *recorded* rather than replayed:

| Situation | What happens |
| --------- | ------------ |
| fresh — no tables | every migration is applied |
| objects present, no `_prisma_migrations` | those migrations are recorded as applied, the rest are applied |
| a migration left unfinished by an interrupted run | it is marked rolled back, then applied again |
| a migration half applied — some objects there, others not | it stops and names them; neither replaying the SQL nor recording it as applied would be true |
| history complete | anything genuinely pending is applied |

Every Prisma command it runs carries an explicit `schema`, because the history
table is found through the *connection* while `migrate deploy` looks for it in
the schema the datasource declares. A URL without `schema=` therefore puts the
history in `public` and leaves the deploy unable to see it (`P1014`) — which is
exactly what happened here, and why a database can hold the app's tables in
`chromabrew` and its migration history in `public` at the same time.

That second row is this production database. It predates `prisma/migrations/`
entirely and was built by hand — the pre-audit schema first, then
`psql -f prisma/audit-migration.sql` — so a bare `prisma migrate deploy` refuses
it with `P3005` (*The database schema is not empty*), and once the baseline is
recorded it tries to re-create tables that are already there: the first
`CREATE TABLE "Scan"` fails with *relation already exists*, Prisma records that
migration as failed, and every later migration — and so every later deploy — is
blocked with `P3009` until someone resolves it. Recording what is already
present avoids both. Nothing that exists is touched: `migrate resolve` writes
one row to `_prisma_migrations`, and the deploy applies only what is genuinely
missing.

The step ends by asserting the six audit tables **and** the two share columns on
`Scan` are visible in the schema the app queries. A part-migrated database
passes a table check and still fails on the first scan, with *The column
Scan.shareToken does not exist in the current database*.

The step is skipped unless `VERCEL_ENV=production` or `RUN_DB_MIGRATE=1` is set,
and skipped when `DATABASE_URL` is unset, so previews and local builds never
migrate a shared database.

On this host — no web build — run the same script directly:

```bash
cd /srv/chromabrew
RUN_DB_MIGRATE=1 node scripts/db-migrate.mjs
npx prisma generate
```

Driving Prisma by hand means the same decisions in the same order — record the
baseline when the history is missing, record any migration whose objects are
already in the database, resolve a migration left unfinished, then deploy:

```bash
npx prisma migrate resolve --rolled-back <an unfinished migration>   # only if one exists
npx prisma migrate resolve --applied 20261011000000_baseline        # only if history is missing
npx prisma migrate resolve --applied 20261012000000_audit_scanning  # only if its tables exist
npx prisma migrate deploy
npx prisma generate
```

A brand-new database needs none of the resolves: `npx prisma migrate deploy` on
its own applies all three. Everything here is plain SQL, so
`psql "$DATABASE_URL" -f prisma/migrations/<migration>/migration.sql` reproduces
the same result on a host with no Node toolchain.

Running the worker against an unmigrated database fails at the first claim,
which it logs and backs off from — it will not spin.

## 6. Screenshot storage

Written by `src/lib/audit/screenshot-store.ts` to `AUDIT_SCREENSHOT_DIR`, or
`./.audit-screenshots` relative to the working directory when unset. Both the
worker and the web app must point at the same directory if the app is to serve
the images: the web app serves them through
`/api/audit/scan/[scanId]/screenshot`, which reads the stored filename from the
row and re-checks it resolves inside that directory. The directory is therefore
**never** served by the web server directly and must not be exposed publicly.

Filenames come only from validated scan and page ids, so a request can never
name a file.

**Retention is not implemented.** Files accumulate; `deleteScreenshotsFor(scanId)`
exists but nothing calls it on a schedule. Add a `tmpfiles.d` rule or a cron
`find` if the volume matters:

```bash
find /var/lib/chromabrew/screenshots -name '*.png' -mtime +90 -delete
```

## 7. Safety

This process executes JavaScript written by strangers and holds a database
credential, so treat it as the deployment's least-trusted component:

- Run it as the unprivileged `chromabrew-worker` user, never as `postgres` or
  root, and give it write access only to the screenshot directory.
- Prefer a database role that can read and write the audit tables but not the
  user, account or session tables.
- Egress can be firewalled at the host: the worker only needs outbound 80/443
  for pages it audits, plus DNS and the database port.
- Every subresource request is policed against the same SSRF rules as the
  submitted URL, and the browser context is per-scan and closed in a `finally`.
- **DNS rebinding is not closed**: the guard validates the addresses a hostname
  resolves to, but the connection resolves the name again. See the security
  section of `docs/AUDIT_ARCHITECTURE.md`.

Do not paste page content, SQL or credentials into logs; the worker logs scan
ids, statuses, durations and file paths only.

## 8. Verifying the host end to end

```bash
# 1. The worker is up and sees a browser.
sudo systemctl status chromabrew-audit-worker --no-pager
journalctl -u chromabrew-audit-worker -n 20 --no-pager   # expect the "ready" line

# 2. Queue a real scan through the web app's API.
curl -sS -X POST https://www.chromabrew.com/api/audit/scan \
  -H 'content-type: application/json' \
  -d '{"url":"https://example.com/","scope":"single_page","viewport":"desktop"}'
# → {"id":"cmv4...","status":"queued","stage":"validating"}

# 3. Watch the worker log for exactly one line for that id.
journalctl -u chromabrew-audit-worker -f
# → audit-worker scan cmv4... completed (browser) in 8.4s

# 4. Confirm the record, and that the browser pipeline — not the fallback — ran.
curl -sS https://www.chromabrew.com/api/audit/scan/<id> | jq '{status,renderMode,durationMs}'
# → {"status":"completed","renderMode":"browser","durationMs":8412}

# 5. A screenshot exists and is served.
ls -l /var/lib/chromabrew/screenshots
curl -sSI "https://www.chromabrew.com/api/audit/scan/<id>/screenshot?page=<pageId>" | head -1
# → HTTP/2 200
```

If step 3 prints nothing and step 4 reports `renderMode: "fetch"`, the web tier
claimed the scan first — see §2.

## 9. Operating notes

- One worker processes scans sequentially. Running a second process doubles
  throughput safely (claiming is atomic); the global concurrency cap in
  `src/lib/audit/types.ts` still bounds how much work the database will accept.
- `recoverStaleScans()` runs on every poll and fails scans left `running` for
  more than ten minutes, so a crash or deploy cannot strand a job.
- Upgrading: `git pull`, `npm ci --include=dev`,
  `RUN_DB_MIGRATE=1 node scripts/db-migrate.mjs` (it baselines a pre-migration
  database itself, so there is no resolve step to remember),
  `npx playwright install --with-deps chromium`, then
  `sudo systemctl restart chromabrew-audit-worker`.
