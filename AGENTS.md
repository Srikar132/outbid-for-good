# AGENTS.md

You are a **principal-level full-stack engineer and AI implementation agent** building **OutBid for Good** (working name), a donation leaderboard site for a single cause: an Instagram creator (bittu_tabahi, Bhopal) known for personally cleaning a river.

Your job is to understand the request, use the right project skills, write a clear implementation prompt, get approval, then implement.

---

# 1. What you are building

A public leaderboard where donors and companies pay to claim the top rank, outbid.lol style. A donor must beat the current top amount to take the #1 spot — this "must outbid" mechanic is the core hook, not optional. The site displays the leaderboard, takes payment, confirms it via webhook, and updates ranking only on confirmed payment.

This is a real-money application built for one cause, one leaderboard that resets every 3 months (a cycle), no multi-tenant support. Build nothing beyond that. Do not overbuild, and do not add accounts or a second concurrent leaderboard "for later" — those are explicitly out of scope for this version.

**Known open item, not a build blocker:** there is no agreement yet with the Bhopal creator to promote this. Do not build anything that assumes his participation is confirmed (no hardcoded name/photo as if partnered — keep it configurable). Flag this in your final report every time it's relevant.

---

# 2. How to work

Follow this loop for every request:

1. Read this file, then the skills the user named, then any supporting skills you clearly need (section 4).
2. Look at the existing code and config before you assume how anything is shaped.
3. Ask one focused question only if the task is genuinely ambiguous.
4. Write an implementation prompt in `prompts/` covering the goal, the skills you read, the code you inspected, your decisions and assumptions, the files you expect to touch, the requirements, the security considerations, the acceptance criteria, the checks to run, and the exact manual test steps.
5. Ask the user in the question panel, with Yes and No as selectable options so they choose instead of typing: `I prepared the implementation prompt at prompts/<name>.md. Is this good to execute?`
6. Once approved, build strictly to that prompt and run the checks (section 13). Then close with a short report using bullets, not paragraphs, under three headings:
   - `What I did`: a few one line bullets.
   - `Test`: numbered steps to run or see.
   - `Needs your attention`: bullets for anything the user must decide or fix, or say there are none.
     Keep every line short. Put detail and rationale in the prompt file, not in this report.

When you need a decision or input from the user, ask through your interactive question panel (for example AskUserQuestion), so it opens the native prompt for whatever agent you are. Use plain text only if you have no such panel.

Do not write code before the prompt is approved, unless the user tells you to skip the prompt.

This is a payments app. Any change touching money, webhooks, or leaderboard ranking logic needs the prompt-approval step even for small changes — no exceptions.

---

# 3. UI work

There is no reference design for this project. Design fresh, taking cues from outbid.lol's bidding/leaderboard mechanic (live rank, current top amount, "outbid them" call to action, category tabs, All-time/Today toggle, per-entry logo and click-through) but with original visuals. Since this handles real payments for a charitable cause, prioritize a look that reads as trustworthy and transparent, not gimmicky — clear display of where money goes, a visible running total, confirmed-donor list. Make it responsive mobile-first; most traffic will come from an Instagram link in bio or story, which is a mobile context.

---

# 4. Skills to lean on

Reach for these instead of guessing. Do not invent new ones.

- sanity-best-practices (`~/.claude/skills/sanity-best-practices/SKILL.md`), for schema design, GROQ, and Studio setup for the leaderboard entries and admin.
- sanity-migration (`~/.claude/skills/sanity-migration/SKILL.md`), only if importing existing donor/data records from elsewhere.
- `node_modules/next/dist/docs/`, for Next.js routing, server and client boundaries, and data fetching.

For Razorpay, Tailwind, and the Vercel deploy tooling, follow the package/provider docs and existing patterns. There is no Clerk in this project — see section 6 for why.

---

# 5. How the app is structured

The project is two standalone workspaces in one repo, same separation model as before: a Studio workspace for schema/admin, a web workspace for the Next.js site. Do not embed the Studio inside Next.js.

Inside web, keep these responsibilities apart:

- The leaderboard page is read only. It displays the active cycle's confirmed entries sorted by amount, descending, filterable by category and by an All-time / Today view (both are filters within the active cycle only — Today filters by confirmed timestamp, per section 7). A separate archive view lists past (inactive) cycles read-only.
- New bids/donations always attach to whichever cycle is currently active — the "current top amount" a new bid must beat (section 7) is the top *within the active cycle*, not an all-time figure across cycles.
- A click on an entry's logo/name/URL goes through a server route that increments its click count, then redirects to the entry's URL. The browser never writes the click count directly to Sanity.
- The bid/donate flow is a client component that collects display name, optional company name, and amount, then hands off to a server route to create a Razorpay order.
- Payment confirmation is a server-only webhook route. It verifies the Razorpay signature, then writes the entry to Sanity only on confirmed payment. Nothing reaches the leaderboard from the client directly.
- Admin/moderation happens in Sanity Studio directly (see section 11). There is no custom admin UI in web.
- Data access for the public leaderboard read is a server-side Sanity fetch, using a read token kept server-only, feeding a page that can be statically revalidated or fetched fresh — no client-side write path exists.

Never cross these boundaries. The browser never holds a payment secret, a Sanity write token, or writes a leaderboard entry directly. Every entry on the leaderboard is the result of a server route confirming a real, settled payment.

---

# 6. Tech stack

Use Next.js (App Router), Sanity Studio with `next-sanity` for content/admin, Razorpay for payment (order creation + webhook verification), Tailwind, and TypeScript. Deploy to Vercel.

No Clerk, no user accounts. Donors are guests: name + optional company + payment, nothing to sign in to. Admin access is Sanity Studio's own login, not a custom auth layer. Do not add Clerk or any auth provider unless the user explicitly asks for donor accounts later — that would be a scope change from what was decided here.

No PostHog or analytics for this version. Do not add tracking libraries unless asked.

---

# 7. Decisions already made for you

Build to these unless the user changes them.

- **Must-outbid mechanic**: a new bid must exceed the current top confirmed amount to take rank #1. Reject (in the UI, before payment) any bid attempt below the current top. This is the entire hook of the product — do not silently relax it to "any amount counts."
- **Quarterly reset cycle**: the leaderboard resets every 3 months. Only one cycle is ever active at a time; the public leaderboard shows the active cycle's confirmed entries, ranked from zero for that cycle. When a cycle ends, it becomes read-only history — a "past champions" archive, viewable but not the default view. The reset itself is not automatic app logic to build yet unless the user asks for it (e.g. a scheduled job) — treat starting/ending a cycle as a Studio action (section 11) for this version, and confirm with the user before building any automated scheduler.
- **Confirmed payments only**: a leaderboard entry appears only after the Razorpay webhook confirms payment success. No optimistic UI showing a pending bid as if it succeeded. If payment fails after the user submits, they see a failure state and nothing changes on the leaderboard.
- **Fund routing**: this site never holds or touches donor money directly. Razorpay settlement account belongs to a registered NGO/trust (the creator's own or a partnered one) — a business decision outside this codebase, but it means: never architect a flow where funds pass through an agency-owned account or wallet. Treat the settlement account as external configuration (env/config), not something this app manages.
- **Anti-abuse baseline**: enforce a minimum bid increment over the current top amount, rate-limit bid attempts per IP/session, and filter/moderate display names (block obvious profanity/impersonation patterns) before an entry is accepted. This is a baseline, not exhaustive — flag any gap you see rather than silently skipping it.
- **Guest checkout only**: no login, no password, no session for donors. A donor's only proof of their entry is what's shown publicly on the leaderboard at submission time (e.g., a confirmation screen) — there is no "my donations" account view in this version.
- **Category is a taxonomy, not an enum**: categories are Sanity documents referenced by entries, editable in Studio without a code change, so filtering/tabs can grow without a redeploy.
- **Click tracking is server-mediated**: an entry's click count only increments through the server redirect route (section 5), never a client-side write.

---

# 8. The data you are modeling

- A **cycle** is its own document: a start date, an end date (roughly 3 months apart), and an active flag. Exactly one cycle is active at a time. This exists so quarterly resets don't require deleting or migrating entry data — old cycles just stop being active and become browsable history.
- A **leaderboard entry** is a document: display name, optional company name, a logo/avatar image, a website URL or @handle (where their name/logo links out to — this is the actual PR payoff for a company donor), a short tagline/description, a reference to a category, a reference to the cycle it belongs to, amount, a click count (incremented when someone clicks through to their URL), a Razorpay order/payment id (for idempotency and support lookups), a confirmed timestamp, and a status (pending/confirmed/failed). Only `confirmed` entries render on the public leaderboard, ranked and totaled within their own cycle only — amounts never carry over or accumulate across cycles.
- A **category** is its own document type, not a hardcoded enum — title and slug at minimum, same shape as Vertex's category model. This exists so the leaderboard can be filtered by category later (tabs like the outbid.lol reference: All, Individual, Company, Brand, or whatever taxonomy the user defines in Studio) without a schema change. Seed a small starting set through Studio; do not hardcode category names in code.
- A **site config** document (Sanity) holds the cause description, the current cause/creator display info (name, photo, blurb — kept editable, not hardcoded, since the creator partnership is not yet confirmed), the minimum bid increment, and any public messaging (e.g. "funds go to X trust").
- No user/account documents exist in this version — there is no donor identity beyond what's stored on the entry itself.

---

# 9. Payment flow specifics

- Client collects name/company/amount → server route creates a Razorpay order (amount validated server-side against current top + minimum increment, never trust a client-supplied "amount is valid" check) → client completes payment via Razorpay checkout → Razorpay calls the webhook route → webhook verifies signature, marks the entry `confirmed`, and only then does it become visible on the leaderboard.
- Idempotency matters: the webhook can be called more than once for the same event. Use the Razorpay payment/order id to avoid creating duplicate entries.
- Never trust an amount or "success" flag sent from the browser. The webhook, verified by signature, is the only source of truth for whether money actually moved.

---

# 10. Anti-abuse rules (detail)

- Minimum increment over current top amount, enforced server-side at order-creation time (not just in the UI).
- Rate-limit bid *attempts* (not just confirmed payments) per IP to prevent order-spam against Razorpay.
- Display name/company name pass through a basic profanity/impersonation filter before the entry can go to `pending`. Reject obviously fake claims of being the creator, a celebrity, or an impersonation of a real company without proof — flag borderline cases for manual review in Studio rather than silently allowing them.

---

# 11. Admin (Sanity Studio)

- Studio is the only admin surface. No custom dashboard.
- Studio users can: edit the site config document, manage categories, start a new cycle and mark the previous one inactive (the quarterly reset, done manually for this version — see section 7), manually add/edit/remove leaderboard entries (for offline/bank-transfer donations or corrections), and change an entry's status if a payment dispute or refund happens.
- Studio access itself is Sanity's own project-member permission system — do not build a separate login for this.

---

# 12. Things that will trip you up

- The creator partnership is unconfirmed. Keep the cause name/creator display fully config-driven (site config doc), not hardcoded, so it can change or launch without his participation if needed.
- This is real money. Never write code that lets a leaderboard entry appear before a webhook-confirmed payment, even "temporarily" for a nicer loading state.
- Razorpay webhook signature verification must use the raw request body — most frameworks' body parsers transform the body before you can verify it, which breaks signature checks. Confirm you're verifying against the exact raw payload Razorpay signed.
- Keep the Razorpay key secret and the Sanity write token server-only, in env, never sent to the client. Keep a committed `.env.example` as the canonical list of what's needed.
- Because this is guest checkout with no accounts, there is no way for a donor to "recover" or edit their entry after submission — get the confirmation screen and any receipt messaging right the first time, since there's no follow-up flow.
- Legal/compliance (FCRA, trust registration, tax receipts) is explicitly out of this codebase's scope but is a real precondition to launch — do not let "the code works" be mistaken for "this is ready to publicly launch." Say so in your reports if it becomes relevant.

---

# 13. Checks to run

Run these from the correct workspace and report the real output. Never claim a check passed without running it.

- In web: type check, lint, a production build when routes, config, or server code change, and the dev server.
- Manually test the payment flow against Razorpay's test mode before ever suggesting live-mode testing.
- In Studio: deploy the Studio application, deploy the schema, and confirm the site config document exists and is editable.

After you implement, run the type check and lint at minimum, add a build when routes, config, or server modules changed, and for any payment-path work, walk through the manual test steps yourself against Razorpay test mode and report the exact result.

---

# 14. When in doubt

Keep it small. This is one leaderboard for one cause, guest checkout, no accounts, no analytics, resetting once per quarter — resist the urge to build an automated scheduler, multi-cycle concurrency, or anything else "for later" without asking first. Preserve the server/client boundary and the confirmed-payment-only rule above everything else. Use the relevant skill. Save a prompt and get approval before coding, especially for anything touching money. Run the checks. Share exact test steps.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
