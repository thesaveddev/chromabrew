# Launch pack — the AI-visibility angle

**Story in one line:** every ChromaBrew website audit now grades how AI
answers see your site — and the free llms.txt generator fixes what it finds.

This file is the copy-paste kit for the spike (Product Hunt + Show HN).
Post from your own accounts; nothing here auto-publishes.

## What is actually true (do not overclaim)

Each audit runs four deterministic AI-readiness checks:

1. `ai-robots-txt` — is there a robots.txt for crawlers to read?
2. `ai-bot-blocked` — does robots.txt block GPTBot, ChatGPT-User,
   ClaudeBot, PerplexityBot, Google-Extended or CCBot at the root?
3. `ai-llms-txt` — is there an /llms.txt discovery file?
4. `ai-trust-signals` — contact link and/or Organization JSON-LD present?

The generator drafts `llms.txt` **and** `ai.txt` from a site name,
one-line description, up to five key pages and crawler allow-list, then
tells you to upload both to the site root and re-run the audit to confirm.
Free, no sign-up. The audit finding links straight to the generator, and the
generator links back to the audit — the loop is closed in-product.

Do NOT claim rankings, citations, or "get cited by ChatGPT" outcomes. The
honest promise is: know what AI crawlers see, fix the machine-readable
parts, verify the fix.

---

## 1. Product Hunt listing

**Name:** ChromaBrew

**Tagline (60 chars):** Free website audit that grades your AI visibility

**Description (first 2 lines matter most):**

> ChromaBrew audits any website for accessibility and color contrast — and
> now grades how AI search sees it too: robots.txt guidance, blocked AI
> crawlers, missing llms.txt, and trust signals AI citation engines look for.
>
> Every finding ships with the exact fix, and the built-in llms.txt
> generator drafts the discovery file for you. Free, no sign-up, re-run the
> audit to confirm the fix.

**Topics:** Developer Tools, Artificial Intelligence, SEO, Web Design

**Thumbnail:** the audit report's AI-discovery section (not the landing
page — proof beats promise).

**Maker comment (post within the first hour):**

> Hey hunters! I'm building ChromaBrew, a free website auditor. Today's
> launch: every audit now includes an AI-visibility grade.
>
> The four checks: (1) does your robots.txt give AI crawlers guidance,
> (2) are you accidentally blocking GPTBot/ClaudeBot/PerplexityBot at the
> root (super common — a scraper block catches them in the same net),
> (3) do you serve llms.txt, and (4) do you have machine-readable trust
> signals (contact link, Organization schema).
>
> If llms.txt is missing, the built-in generator drafts it + ai.txt from
> your site name and key pages, and you re-run the audit to verify.
>
> Try it on your own site and tell me what grade you get — especially if a
> finding looks wrong, I want those reports. What else should an
> AI-visibility check cover?

---

## 2. Show HN post

**Title:** Show HN: Every website audit now grades AI visibility (free, with fix-it generator)

**Body:**

> I run ChromaBrew, a free website auditor (accessibility + color). I just
> shipped AI-readiness checks in every audit and I'd like HN's eyes on the
> heuristics before I promote them further.
>
> Four deterministic checks, no LLM involved: robots.txt presence for AI
> crawlers, root-level blocks against GPTBot/ChatGPT-User/ClaudeBot/
> PerplexityBot/Google-Extended/CCBot parsed from the actual robots.txt,
> llms.txt presence, and trust signals (contact link in markup, Organization
> JSON-LD in raw HTML).
>
> If llms.txt is missing, a generator drafts llms.txt + ai.txt (H1 site
> name, blockquote summary, key-page list, robots.txt pointer line) and the
> audit finding links to it; you re-run the audit to confirm the file is
> reachable.
>
> My open questions: is parsing robots.txt for those six bot tokens the
> right detection set, or am I missing crawlers that matter? And is
> llms.txt actually being honored anywhere yet, or is it still
> aspirational? Audit your site and tell me where the checks are wrong.

**Rules of engagement:** post Tuesday–Thursday morning ET, be in the
comments for the first 4 hours, reply to every wrong-finding report with
what you'll change. No "upvote my launch" anywhere — that backfires on both
platforms.

---

## 3. Screen-recording script (60–90s, no voiceover needed)

Artifact-first: this same recording doubles as the Reddit/IH/X post.

1. (0–10s) Paste a real site URL into the audit form. Use a site that
   FAILS — missing llms.txt, blocked bots if you can find one.
2. (10–30s) Fast-forward the scan with a caption ("~30s scan"), land on
   the report scrolled to the AI-discovery findings.
3. (30–55s) Click through to the llms.txt generator, fill 3 fields, copy
   the output. Caption: "drafts llms.txt + ai.txt".
4. (55–75s) Re-run the audit, show the finding cleared. Caption: "verify
   the fix in the same tool".
5. End card: URL + "free, no sign-up".

Record at 1280×720, captions burned in, export ≤25MB for X/PH gallery.

---

## 4. Launch-day checklist

- [ ] Deploy is green on production (the `ba8f323` batch).
- [ ] Run one real audit + one test signup; confirm `audit_completed` and
      `signup_completed` appear in Vercel → Analytics → Events.
- [ ] PH assets ready: logo, 3 gallery images (report AI section,
      generator, before/after finding), recording from §3.
- [ ] Schedule PH for 00:01 PT Tuesday–Thursday; maker comment drafted
      above, post it in hour one.
- [ ] Show HN on a different day than PH (never same-day — splits your
      comment presence).
- [ ] Directory submissions queued for the week after (BetaList, Uneed,
      Toolur, AI-tool directories for the llms.txt generator page).
- [ ] Reply template for wrong-finding reports: thank, reproduce, file,
      ship fix, reply with the commit.

## 5. What I need from you

- PH and HN are your accounts — I can't post for you. Everything above is
  copy-paste ready; tell me when they're live and I'll help triage feedback.
- One real failing site for the recording (yours or a volunteer's — never
  audit-shame someone's site publicly without permission).
