# Launch plan — Product Hunt × Show HN × Figma plugin

A coordinated burst for ChromaBrew, sequenced so the three channels amplify
one window instead of three disconnected spikes. Research grounding:
[Product Hunt launch guide](https://www.producthunt.com/launch),
[Show HN guidelines](https://news.ycombinator.com/showhn.html),
[Figma Community selling](https://help.figma.com/hc/en-us/articles/12067637274519-About-selling-Community-resources).

Two SEO preconditions this burst should not run without, both from
`SEO_AUDIT.md`: the metadata second pass (done — 0 hard failures) and the
**Search Console baseline** (not yet captured). Launch day is the single
biggest backlink/impressions event a young site gets; measuring it without a
baseline wastes it.

## 1. Sequencing

| Day | Channel | Why then |
| --- | --- | --- |
| Mon | **Figma plugin published** to Community | The plugin must exist before the launch posts, so PH/HN traffic that *is* a designer can install instead of bounce. |
| Tue | **Product Hunt**, 12:01 a.m. Pacific | PH days run midnight-to-midnight PT; Tuesday–Thursday is the standard advice for maker-audience overlap. |
| Wed | **Show HN**, 9–11 a.m. ET | Avoids the PH comment-day collision, catches the US morning logins, and gives Tuesday's traffic a second wave. |
| Thu–Fri | Follow-ups: Dribbble/Behance shots, r/web_design feedback thread, Indie Hackers post-mortem | Earned-media tail while the launch stories are still fresh. |

Expectations, from the one survey we found (MySignature, self-reported):
typical PH launches bring **500–2,000 visitors**, not tens of thousands. Treat
PH as a concentrated feedback + backlink moment and Show HN as a
discussion moment. The durable traffic is the SEO flywheel this launch seeds —
see `PROGRAMMATIC_SEO_PLAN.md` §6.

## 2. Pre-launch checklist (T-7 → T-1)

**Technical**

- [ ] `npm run seo:audit` against production: 0 hard failures (re-run T-1).
- [ ] Search Console property verified, baseline captured: indexed counts,
      top queries, coverage — logged as the launch baseline.
- [ ] Lighthouse pass on `/`, `/design-system`, `/audit` (mobile): the HN
      audience checks. Fix any red before launch, not during.
- [ ] Analytics confirm events fire: generator complete, export click,
      signup, audit submit — plus UTM handling for `?ref=ph`, `?ref=hn`,
      `?ref=figma` (append automatically from referrer or landing path so
      channel attribution survives PH's link redirect).
- [ ] Decide the canonical domain once: repo defaults say
      `chromabrew.app` (`README.md`) while marketing assets and the audit use
      `chromabrew.com`. Canonical, OG URLs, sitemap and every launch asset
      must agree on one.
- [ ] AdSense: ads are live in production. Confirm they don't appear above
      the fold on `/` or `/design-system` for a first-time visitor — launch
      traffic judges the page in three seconds.
- [ ] OG/social card renders correctly (Twitter/X and LinkedIn card
      validators) — the social tail depends on it.

**Assets**

- [ ] 60-second demo video: one color → full design system → WCAG pass →
      export, screen-recorded. The `brag-output/` composition can be the
      brand intro, but the PH gallery needs the *real product* recording.
- [ ] 4–6 PH gallery images (generator, contrast table, exports, audit).
- [ ] Drafts written (see §3–4): PH tagline options, founder's first
      comment, Show HN title options.
- [ ] Launch-day announcement post + Dribbble/Behance shot exports — the
      `marketing - Copy/` SVG posts are the visual system to match.

## 3. Product Hunt play

- **Launch at 12:01 a.m. PT** on launch day (PH's own guide).
- **Tagline candidates** (≤60 chars, PH truncates): "One color in, a complete
  accessible design system out" / "Turn one color into an accessible design
  system — free, no sign-up" / "Design systems from one color, WCAG-checked".
- **Founder's first comment:** why it was built (the "contrast is measured,
  never assumed" story), what's genuinely different (full system + audit, not
  another palette shuffle), and a question for designers ("what should the
  next export target be?").
- **Rules:** do *not* ask people to upvote — PH's guide explicitly says ask
  them to visit and comment. No private-group vote solicitation; accounts
  from one network voting in a pattern is how launches get disqualified.
- **Have the product open and free:** no signup wall before the generator
  does its trick; signup appears after the "aha" (systems saved to projects).
- **Capture:** rank, upvotes, visitors (analytics with the PH referrer),
  first-day signups, and every feedback comment — founders' post-mortems
  consistently say the feedback was worth more than the traffic.

## 4. Show HN play

- **Submit 9–11 a.m. ET Wednesday** with something *playable* — the official
  Show HN guidelines ask for a thing people can use immediately, the author
  present in the thread, and no vote asking.
- **Best target:** the generator pre-seeded with a striking color
  (`/design-system?primary=…` deep link) so the first paint already shows a
  finished system. A landing page gets "HN is not your marketing channel"
  replies; a working artifact gets questions.
- **Title options:** "Show HN: One color becomes a full design system (WCAG
  measured, not assumed)" / "Show HN: I built a color-to-design-system
  generator with contrast checks built in".
- **Angle that lands with HN:** the engineering substance — OKLCH scale
  generation, the WCAG engine, contrast *fixing*, browser-only processing.
  Prepare honest answers about what the free tier includes, what the
  (planned) paid Audit does, and your data policy (nothing leaves the
  browser).
- **Be in the thread for 4+ hours** after posting. Same no-solicitation rule.

## 5. Figma plugin (publish first)

- **Scope (v1):** inside Figma, open a ChromaBrew seed (eyedropper or paste
  hex) → send back the generated scale + semantic tokens as Figma variables /
  styles. The repo already has the payload path: the Tokens Studio JSON
  export adapter (`src/lib/design-system/exports/figma.ts`) is designed to
  "paste directly into the Figma Tokens plugin" — v1 can honestly be
  *generate on chromabrew.com → paste into Figma via the plugin*, with a
  direct API later.
- **Listing:** title and description carry the same keyword set as
  `/design-system`; gallery images show variables landing in a real file; the
  plugin's About links back to the generator with a UTM. Coolors treats its
  plugin listing as a primary surface (2.5M users claimed on the listing) —
  this is the highest-leverage unbuilt channel in the roadmap's Phase 4.
- **Paid tier note:** Figma's native Community payments take a flat 15% and
  new paid-plugin eligibility is uncertain — keep the plugin free as a
  distribution vehicle and sell Pro/Audit on the web, where entitlement
  already lives (`src/lib/entitlements.ts`).

## 6. Supporting channels (in the tail, follow each venue's rules)

- **Reddit:** `r/web_design` has a weekly feedback thread; `r/graphic_design`
  prohibits self-promotion outright. Post the artifact, not the ad — and
  read each subreddit's current rules first.
- **Dribbble / Behance:** publish the before/after palette-shot series
  (visual language already exists in `marketing - Copy/`), link in profile +
  description, not in the caption.
- **X/Twitter thread:** one color → system screen recording, with the WCAG
  table moment as the payoff; reply to anyone asking "how do I pick
  accessible colors".
- **No astroturfing anywhere** — including cross-posting launch-day accounts
  into HN or Reddit threads. Bans during launch week are unrecoverable.

## 7. Metrics captured (so the burst teaches something)

| Metric | Source | When |
| --- | --- | --- |
| PH rank + upvotes + visitors + comments | PH page, analytics (`ref=ph`) | T+1d, T+7d |
| HN points + comments + referral visits (`ref=hn`) | HN, analytics | T+1d, T+7d |
| Figma plugin installs + listing clicks | Figma dashboard | weekly |
| Signups / audit submits per channel | analytics events × UTM | T+7d |
| Search Console: indexed count, impressions, top queries | GSC | baseline now, then T+7d / T+30d against baseline |
| Backlinks earned from PH/HN roundups | GSC Links / manual | T+30d |

The T+30d GSC comparison is the number that matters: it tells us whether the
burst converted attention into the durable organic flywheel, which is the
only path from launch traffic to Coolors-scale traffic (see the 18–36 month
reality in the monetization research).
