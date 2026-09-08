# Remove logo upload — use favicon derived from URL/handle everywhere

## Goal

Drop the donor-uploaded logo feature entirely. Every place that would show
a logo already has (or can trivially get) a favicon derived from the
entry's own `url` field via `faviconUrlFor()` (`lib/identity.ts`) — the same
helper `ClaimBand.tsx` and `ConfirmClaim.tsx`'s live preview already use
before the donor ever submits. Auditing actual usage shows the upload
machinery supports exactly one render site and two dead fetches:

- `components/leaderboard/LeaderboardList.tsx` (the actual public
  leaderboard) never reads `entry.logo` at all — it only ever shows a
  category icon on a tinted background.
- `components/leaderboard/EntryDetail.tsx`'s "Also in {category}" sibling
  list fetches `logo` per sibling (`ENTRY_DETAIL_QUERY`'s `siblings`
  projection) but `SiblingRow` never receives or renders it — dead data.
- `components/leaderboard/EntryDetail.tsx`'s own hero image is the **only**
  live render of an uploaded logo, with an existing category-icon fallback
  when there isn't one.

So removing the upload path costs exactly one visual: the entry-detail hero
falls back to a favicon instead of a hand-picked logo image. Given a
favicon is already derivable and shown everywhere pre-submission, this is a
net simplification, not a feature loss — one less form field, one less
Sanity asset upload + rate-limit bucket + 2MB validation path, one less
thing that can fail during checkout.

## Skills / docs read

None new needed — this is a deletion/simplification of code already
written this session (the Server Action + Zod refactor), not new
Next.js/Sanity surface area. Re-read the files listed below.

## Code inspected

- `studio/schemaTypes/leaderboardEntry.ts` — `logo` is a plain `image`
  field (`options: { hotspot: true }`), and the Studio list `prepare()`
  maps `media: 'logo'` for the document-list thumbnail.
- `sanity/lib/queries.ts` — `logo` is projected in `CONFIRMED_ENTRIES_QUERY`,
  `ENTRY_DETAIL_QUERY` (both the root entry and the `siblings` sub-query).
- `lib/validation/claim.ts` — exports `logoFileSchema` and `MAX_LOGO_BYTES`
  (image type + ≤2MB checks), used by both `ConfirmClaim.tsx` (client-side
  file validation) and `app/donate/actions.ts` (server-side re-validation).
- `app/donate/actions.ts` — `createClaim` has a whole branch: separate
  `upload:${ip}` rate-limit bucket, `logoFileSchema.safeParse`, a
  `writeClient.assets.upload("image", ...)` call, and sets
  `entry.logo = { _type: "image", asset: { _ref: logoAssetId } }` on
  creation. Also carries `UPLOAD_FAILED` in the `ClaimError` union and
  `"logo"` in `ClaimField`.
- `components/leaderboard/ConfirmClaim.tsx` — `logoFile`/`logoPreview`/
  `logoError` state, `handleLogoChange`, the file `<input>`, a
  `posthog.capture("logo_uploaded", ...)` call, and `avatarSrc` falls back
  to `logoPreview` before the favicon.
- `components/leaderboard/EntryDetail.tsx` — renders `entry.logo` via
  `<SanityImage>` when present, else `CategoryIcon`.
- `components/SanityImage.tsx` and `sanity/lib/image.ts` (`urlFor`) — after
  this change, nothing calls either. Confirmed via grep: each is referenced
  from exactly one place, both inside the code being removed here.
- `sanity.types.ts` — auto-generated (`studio`'s `npm run typegen`, i.e.
  `sanity schemas extract --enforce-required-fields && sanity typegen
  generate`). Removing the schema field requires regenerating this, not
  hand-editing it.

## Decisions / assumptions

- **Entry-detail hero uses `faviconUrlFor(entry.url)` with the same
  category-icon fallback** that already exists for the no-logo case today
  (favicon fetch can itself fail/404 client-side — same risk `ClaimBand`
  and `ConfirmClaim`'s preview already accept, not a new one).
- **Delete `components/SanityImage.tsx` and `sanity/lib/image.ts`** rather
  than leave them unused — nothing calls either after this change, and
  per this project's own conventions unused code gets deleted, not kept
  "for later."
- **Existing Sanity documents that already have a `logo` asset keep that
  field's stored value** — removing it from the schema stops Studio from
  showing/editing it and stops new writes, but does not delete the
  underlying image asset or touch existing documents. No migration script;
  this is a forward-only schema change, consistent with how this project
  has handled schema evolution so far (no migrations tooling in use yet).
- **`ClaimError`'s `UPLOAD_FAILED` and `ClaimField`'s `"logo"` variant are
  removed**, not left dead — same reasoning, and it keeps the
  discriminated union honest about what can actually happen.
- Not touching the `posthog_wizard`/Session Replay skills or any other
  PostHog event besides deleting the now-inapplicable `logo_uploaded`
  capture call.
- Studio schema/type regeneration: will run `npm run typegen` from
  `studio/` (per AGENTS.md §13, "deploy the schema" is a required check
  when Studio schema changes) — if that command needs Sanity project
  credentials/login unavailable in this environment, will say so plainly
  rather than hand-editing the generated `sanity.types.ts`, and ask you to
  run it locally instead.

## Files expected to touch

- `studio/schemaTypes/leaderboardEntry.ts` (remove `logo` field + `media`
  mapping)
- `sanity/lib/queries.ts` (drop `logo` from both queries)
- `lib/validation/claim.ts` (remove `logoFileSchema`, `MAX_LOGO_BYTES`)
- `app/donate/actions.ts` (remove upload branch, rate-limit bucket,
  `UPLOAD_FAILED`, `"logo"` field type, entry `logo` write)
- `components/leaderboard/ConfirmClaim.tsx` (remove file input + related
  state/handlers, avatar always uses favicon)
- `components/leaderboard/EntryDetail.tsx` (favicon instead of
  `SanityImage`/`entry.logo`)
- Delete: `components/SanityImage.tsx`, `sanity/lib/image.ts`
- Regenerate: `sanity.types.ts` (via Studio typegen, not hand-edited)

## Requirements

1. No leftover references to `logo`/`logoAssetId`/`logoFile`/`logoPreview`/
   `logoError`/`MAX_LOGO_BYTES`/`logoFileSchema`/`SanityImage`/`urlFor`
   anywhere in the codebase after this change (grep clean).
2. `ConfirmClaim.tsx`'s avatar preview and `EntryDetail.tsx`'s hero image
   both use `faviconUrlFor()` consistently — same helper, same fallback
   pattern already established.
3. `app/donate/actions.ts` no longer touches Sanity asset uploads at all;
   `createClaim`'s only Sanity write is the entry document itself (plus the
   `razorpayOrderId` patch, unchanged).
4. Rate limiting: the `orders:${ip}` bucket stays exactly as-is; the
   separate `upload:${ip}` bucket is removed since there's nothing left to
   rate-limit uploads for.
5. Sanity schema and generated types stay in sync — `npm run typegen` run
   from `studio/` after the schema edit, and the resulting `sanity.types.ts`
   diff committed alongside.

## Security considerations

- None new — this removes a code path (file upload) rather than adding
  one. One less place accepting untrusted binary data server-side is a
  net reduction in attack surface (no more image-type/size sniffing needed
  server-side).
- Favicon URLs are fetched client-side from Google's favicon service
  (`faviconUrlFor` in `lib/identity.ts`) exactly as they already are today
  in `ClaimBand`'s and `ConfirmClaim`'s pre-submission preview — no new
  trust boundary introduced by using it in one more place.

## Acceptance criteria

- Claiming a rank end-to-end no longer shows a logo upload field anywhere
  in the form.
- The entry-detail page (`/entry/[slug]`) shows the entry's favicon (or the
  category icon if no URL/handle was given) instead of an uploaded image.
- `npm run build` succeeds with no dangling imports of the deleted files.
- Sanity Studio, after `typegen`, no longer shows a Logo field on
  `leaderboardEntry` documents; existing documents with old logo data don't
  error out when opened (extra/removed-field data in an existing document
  is not itself an error in Sanity — confirm this holds after the change).

## Checks to run

- `npm run lint` and `npm run build` in `web`.
- `npm run typegen` in `studio/` (regenerates `sanity.types.ts`); if that
  fails for environment/auth reasons, report exactly what failed instead of
  hand-writing the generated file.
- Manual: open `/entry/<some-slug>` for an entry that has a `url`, confirm
  the favicon renders; open one with no `url`/handle (if any exist) and
  confirm the category-icon fallback still shows.

## Manual test steps

1. `npm run dev`.
2. Claim a rank end-to-end — confirm there is no logo upload field in the
   `/donate` confirm form.
3. Complete/skip checkout as before (payment mechanics unchanged), or just
   visually confirm the form layout is correct without submitting.
4. Visit an existing entry's `/entry/[slug]` page — confirm the hero shows
   a favicon (or category icon, if no URL) instead of a broken image or a
   leftover upload UI.
5. Open Sanity Studio locally (`studio`), confirm the `leaderboardEntry`
   schema no longer has a Logo field, and that an existing document with
   old logo data still opens without error.
