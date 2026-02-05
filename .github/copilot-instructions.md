## Kanohi Collector — Copilot Instructions

### Project Tenets
- Ship a maintainable Next.js (App Router) + TypeScript app with server-side draw logic; never leak draw math to the client.
- Keep code small, composable, and typed; prefer pure helpers over ad-hoc inline logic.
- Preserve determinism and idempotency in pack opens; favor transactional updates and explicit invariants.

### Architecture & Data Constraints
- Stack: Next.js + Tailwind + Clerk auth on the frontend; Node/TypeScript backend with Postgres; optional S3/CDN for assets.
- Core entities: `users`, `masks`, `user_masks`, `packs`, `user_pack_progress`, `friends`, `events`, plus immutable pack-open history (`pack_opens`, `pack_open_pulls`).
- IDs: `mask_id` is stable text; user primary IDs are Clerk IDs (string). Use DB-generated IDs (e.g. CUID) for internal rows.
- Packs: 2 pulls per open; pity after 20 packs guarantees ≥1 Rare+; rarity bases COMMON 0.945, RARE 0.05, MYTHIC 0.005; pack luck buff caps at +20% rare+ mass.
- Buff math: Toa = 100%, Turaga = 50%; friend buff small and capped (≤5 friends). Discovery rerolls duplicates with ≤50% chance, max 3 attempts.
- Leveling: protodermis from duplicates 100; cost = 500 * current_level; consume essence on level-up; respect `max_level`.

### API & Behavior Guardrails
- `GET /api/me` is source of truth (equipped masks, buffs, timers, unlocked colors). Only add caching if it can't cause stale game state.
- `GET /api/packs/status`: include `pack_ready`, `time_to_ready`, `fractional_units`, `pity_counter`.
- `POST /api/packs/open`: require auth + idempotency key; lock `user_pack_progress` (`SELECT ... FOR UPDATE`), validate eligibility, run server draw, atomically upsert `user_masks`, update pity/progress, append events, return mask payloads with rarity/color/is_new/essence/levels/unlocked_colors.
- `POST /api/packs/open` idempotency: persist pack opens as an immutable domain event in Postgres keyed by `(user_id, client_request_id)` and replay from stored pulls on retry (don't cache JSON blobs).
- `POST /api/mask/{mask_id}/equip`: validate ownership and slot; optionally prevent duplicate buff types across slots (MVP allows dup masks, blocks identical buff types if enforced).

### Clean Code Expectations
- Favor small pure functions; isolate IO from logic; avoid duplicated formulas (share buff math, rarity sampling, leveling helpers).
- Keep domain types in `lib/types.ts`; derive literals from data to avoid drift; prefer readonly/const.
- Validate inputs at edges; return typed errors; no silent catches. Use assertions for invariants in the draw engine and leveling.
- Maintain deterministic randomness: seed per-request if needed; avoid client-provided seeds.
- Keep components presentational vs. stateful hooks; lift data fetching into server components or typed hooks; memoize derived values, not raw data.

### Frontend & UX Style (from UI doc)
- Visuals: light, airy, premium collectible album; soft gradients, rounded cards, pill buttons, subtle shadows; avoid dark themes, harsh borders, dense layouts, neon accents.
- Motion: gentle fade/slide/scale; no snappy/elastic/gamey effects by default.
- Use color sparingly to highlight rarity/actions; avoid heavy chrome.
- Favor clear hierarchy and breathing room; fewer elements per screen beats density.

### NPE & Tooltip Guidance
- Progressive, contextual tips (no forced slideshow). Key moments: account/guest entry, starter mask pick, first pack open, first duplicate (protodermis), first equip, pack timer, collection browsing. Persist tooltip state per user; allow dismiss/revisit.

### Testing & Quality
- Unit tests: rarity math, buff aggregation/clamp, pity enforcement, discovery rerolls, leveling costs, draw determinism.
- Integration: pack open transactional behavior, idempotency key reuse, concurrent open contention.
- API contracts: snapshot/shape tests for `/api/me`, `/api/packs/status`, `/api/packs/open` responses.
- Performance: aim <300ms pack open; keep draw logic in-memory with DB writes post-selection.
- Observability: emit `pack_open`, `mask_pulled`, `level_up`, `friend_buff_applied` events; structured logging.

### Security & Safety
- Auth required on all game endpoints; validate server-side eligibility (timers, ownership).
- Rate-limit `/api/packs/open` at the edge if possible; otherwise use best-effort Postgres rate limiting per user.
- Never rely on in-memory maps for idempotency/rate limiting in production.
- Never trust client rarity/buff inputs; compute server-side only.

### How to Use These Instructions
- When unsure, prefer explicit constants from this file over inventing new numbers.
- Align with docs/spec: deterministic server draw, transactional persistence, airy UI aesthetic.
- Keep codebase maintainable: typed, small, readable, and covered by focused tests.
