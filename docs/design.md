# Software Design Document — Mask Collector MVP (engineer handoff)

Reference: product spec used to create this design. 

Short version: implement a Next.js frontend + Node (or Go) backend with Postgres. Server-side draw engine (pity, buffs, discovery rerolls), deterministic DB schemas, transactional pack-opening endpoint, collection/equip flows, friend passive buffs, and an asset model that’s 2D-first and 3D-ready.

---

# Architecture & Tech Stack

* Frontend: Next.js (React) + Tailwind, Clerk auth. SSR for /collection pages where helpful, but client-driven pack animation.
* Backend: Node (TypeScript + Nest/Express) or Go — pick team preference. All draw logic **must** be server-side.
* DB: Postgres (primary). Use UUID PKs.
* Cache: Redis for rate-limiting, short-lived locks (pack-open idempotency), and caching `GET /api/me`.
* Storage/CDN: S3 (or equivalent) + CDN for assets (sprite sheets, pre-renders, future glb).
* Observability: structured events into `events` table + wire to analytics (Segment/GA) later.
* Deployment: containerized services on k8s or Vercel + backend. Use environment flags for rates and A/B.

---

# Data Model (DDL-style summary)

Use Postgres. Below are core tables and important fields (indexes & constraints included).

### users

* id UUID PK
* username TEXT UNIQUE
* email TEXT NULL
* created_at TIMESTAMP
* last_active_at TIMESTAMP
* settings JSONB
* created_from_guest BOOLEAN DEFAULT FALSE

Indexes: idx_users_username, idx_users_last_active_at

### masks (master catalog — immutable once published)

* mask_id TEXT PK (e.g., `1`)
* generation INT
* name TEXT
* base_rarity ENUM('COMMON','RARE','MYTHIC')
* base_color_distribution JSONB (e.g. `{standard:80, alt_blue:4, ...}`)
* base_image_ids JSONB (color -> url or asset id)
* buff_type ENUM('PACK_LUCK','TIMER_SPEED','DUPLICATE_EFF','DISCOVERY','VISUAL')
* buff_base_value FLOAT
* max_level INT
* description TEXT
* is_unique_mythic BOOLEAN DEFAULT FALSE
* created_at TIMESTAMP

Indexes: pk on mask_id; idx_generation

### user_masks

* id UUID PK
* user_id UUID FK -> users(id)
* mask_id TEXT FK -> masks(mask_id)
* owned_count INT DEFAULT 0
* essence INT DEFAULT 0 (protodermis pool)
* level INT DEFAULT 0
* equipped_slot ENUM('NONE','TOA','TURAGA') DEFAULT 'NONE'
* unlocked_colors TEXT[] DEFAULT '{}'
* last_acquired_at TIMESTAMP
* CONSTRAINT unique(user_id, mask_id)

Indexes: idx_user_masks_user_id

### packs

* pack_id TEXT PK (`free_daily_v1`)
* name TEXT
* masks_per_pack INT (2)
* guaranteed_min_rarity_floor ENUM default COMMON
* featured_generation INT NULL
* created_at TIMESTAMP

### user_pack_progress

* user_id UUID PK FK -> users.id
* pack_id TEXT FK -> packs.pack_id
* fractional_units INT DEFAULT 0
* last_unit_ts TIMESTAMP
* pity_counter INT DEFAULT 0
* last_pack_claim_ts TIMESTAMP NULL

### friends (separate table recommended vs array on users)

* id UUID PK
* user_id UUID FK
* friend_user_id UUID FK
* status ENUM('PENDING','ACCEPTED','BLOCKED')
* created_at TIMESTAMP

Indexes: unique(user_id, friend_user_id)

### events (telemetry)

* event_id UUID PK
* user_id UUID NULL
* type TEXT
* payload JSONB
* timestamp TIMESTAMP

---

# API Contracts (authoritative server-side semantics)

All endpoints authenticated with Clerk.

### GET /api/me

Return user summary, equipped masks, total effective buffs, next_pack_ready_in_seconds.
Important: include `effective_pack_luck`, `effective_timer_speed`, friend contributions, `fractional_units`, and `unlocked_colors` for each owned mask. This is the single source of truth for client.

### GET /api/packs/status

Response:

```json
{
  "pack_ready": true|false,
  "time_to_ready": 12345,
  "fractional_units": 0,
  "pity_counter": 3
}
```

### POST /api/packs/open

Body: `{ "pack_id": "free_daily_v1", "client_request_id": "<uuid>" }`
Server behavior:

* Idempotency: use `client_request_id` to dedupe repeated calls (store short-lived key in Redis).
* Verify eligibility: compute fractional_units or last_pack_claim_ts + timer speed.
* Acquire DB transaction/lock for user (SELECT FOR UPDATE user_pack_progress) to avoid races.
* Run draw engine (detailed below) to generate N masks (2).
* Persist updates in same transaction:

  * Create/UPDATE user_masks (increment owned_count, update essence/protodermis, level changes, add color to unlocked_colors array if not present).
  * Update user_pack_progress.pity_counter and fractional_units/last_pack_claim_ts.
  * Insert events rows (pack_open, mask_pull, level_up).
* Return a rich response with mask objects including fields: `mask_id, name, rarity, color, is_new, essence_awarded, level_before, level_after, unlocked_colors`.
* Commit and return.

### POST /api/mask/{mask_id}/equip

Body: `{ slot: "TOA" | "TURAGA" | "NONE" }`
Server validates: only if user owns mask; enforce buff-type duplicate block (if required) — spec leaves some choices open; for MVP allow duplicates across slots but prevent equipping two masks with identical buff_type into both slots (optional).

---

# Draw Engine — deterministic server-side algorithm (pseudocode)

Design goals: reproducible, testable, clampable, simple math.

Important constants:

* base_probs = {MYTHIC:0.005, RARE:0.05, COMMON:0.945}
* color distribution from `masks.base_color_distribution`
* pity_threshold = 20
* global_pack_luck_cap = 0.20 (20% relative increase)
* discovery_reroll_cap = 0.5
* discovery_attempts_limit = 3

Pseudocode (high-level):

```
function open_pack(user, pack_id):
  // 1. compute active buffs
  buffs = compute_user_buffs(user) // sums Toa (100%) + Turaga (50%) + friend buffs
  pack_luck_bonus = clamp(buffs.pack_luck, 0, global_pack_luck_cap)

  // 2. apply pity: if user_pack_progress.pity_counter >= pity_threshold then mark guarantee_rare_plus = true

  results = []
  for i in 1..masks_per_pack:
    // choose rarity
    if i==1 and guarantee_rare_plus:
       rarity = sample_rarity_with_forced_rare_plus(pack_luck_bonus)
       guarantee_rare_plus = false
    else:
       rarity = sample_rarity_with_pack_luck(pack_luck_bonus)

    // choose mask_id from masks catalog of that rarity (consider generation bias/featured)
    color = sample_color_for_rarity(rarity)
    mask_id = sample_mask_by_rarity_and_color(rarity, user, preference_for_discovery=0) 

    // discovery reroll if duplicate and user has discovery buff
    attempts = 0
    while (user.owns(mask_id) and attempts < discovery_attempts_limit):
        if random() < min(buffs.discovery, discovery_reroll_cap):
            candidate = sample_different_mask_same_rarity_prefer_unowned(rarity, user)
            if candidate is unowned:
                mask_id = candidate
                break
        attempts += 1

    // determine is_new and essence_awarded
    if user.owns(mask_id):
       essence_awarded = duplicate_value_by_rarity(rarity)
    else:
       essence_awarded = 0

    // record and apply leveling
    update_or_create_user_mask(user, mask_id, essence_awarded, color)
    // add color to unlocked_colors array if not already present
    add_to_unlocked_colors(user, mask_id, color)
    results.push({mask_id, rarity, color, is_new, essence_awarded, ...})
  endfor

  // update pity counter (reset if any rare+ in pack else increment)
  persist results and user_pack_progress atomically
  return results
```

Key sampling functions:

* `sample_rarity_with_pack_luck(bonus)`:

  * rare_plus_base = base_MYTHIC + base_RARE
  * rare_plus_new = rare_plus_base * (1 + bonus)  // apply additive relative boost
  * scale = rare_plus_new / rare_plus_base
  * P(RARE) = base_RARE * scale
  * P(MYTHIC) = base_MYTHIC * scale
  * P(COMMON) = clamp(1 - (P(RARE)+P(MYTHIC)), min=1e-6)
  * Finally, renormalize and sample.

* `sample_mask_by_rarity_and_color(rarity, user, ...)`:

  * Query masks WHERE base_rarity = rarity (and optionally generation).
  * For discovery-prefill, bias sampling weight to masks user does not own. (E.g., weight = 1.0 if unowned else 0.2 if owned.)
  * Use DB-level random ordering with weight for reproducibility (or sample in server memory from a preloaded list).

determinism & randomness:

* Use a server RNG seeded per-pack with `user_id + timestamp + server_salt` if you need reproducible logs. But do not let client control seeds.

---

# Leveling & Protodermis — exact implementation rules (MVP)

* Duplicate protodermis awards: COMMON=1, RARE=5, MYTHIC=50.
* base_by_rarity for level cost: COMMON=5, RARE=25, MYTHIC=200 protodermis.
* Level up rule (MVP chosen): consume protodermis when leveling. Implementation:

  ```
  while user_mask.essence >= cost_for_next_level:
    cost_for_next_level = base_by_rarity * user_mask.level
    if user_mask.essence < cost_for_next_level:
      break
    user_mask.essence -= cost_for_next_level
    user_mask.level += 1
    if user_mask.level >= mask.max_level:
      break
  ```
  
  **Formula:** To level from L to L+1 requires `base_by_rarity * L` protodermis.
  - Level 1→2: COMMON needs 5×1=5, RARE needs 25×1=25, MYTHIC needs 200×1=200
  - Level 2→3: COMMON needs 5×2=10, RARE needs 25×2=50, MYTHIC needs 200×2=400
  - Level 3→4: COMMON needs 5×3=15, RARE needs 25×3=75, MYTHIC needs 200×3=600
* Persist `level` and `essence` (protodermis pool); write an event for each `level_up`.

Buff value compute:

* effective_value = buff_base_value * level * (slot == TURAGA ? 0.5 : 1.0)
* friend contributions: sum up to max 5 friends contributing friend_buff_per_friend each (configurable).

Total pack luck used in draw = clamp(sum of all pack_luck sources, 0, global_pack_luck_cap).

---

# Discovery reroll details

* If a drawn mask is a duplicate AND user has discovery buff:

  * With probability `p = min(discovery_bonus, 0.5)` attempt reroll (max 3 times).
  * Reroll picks another mask from same rarity, preferentially unowned (weighting).
  * If after attempts no unowned found, fall back to duplicate.
* Implement with bounded loops on server to avoid infinite loops; ensure `sample_mask` accepts a `exclude_mask_ids` set to avoid re-selecting same mask.

---

# Concurrency, Transactions & Anti-abuse

* Pack open must be transactional:

  * Acquire DB row lock on `user_pack_progress` (SELECT FOR UPDATE).
  * Update `fractional_units`/`last_pack_claim_ts` atomically.
  * Apply draw and update/create `user_masks` rows in same transaction.
* Prevent double-open by short-lived Redis idempotency key keyed by `(user_id, client_request_id)` with TTL 60s.
* Rate-limit `POST /api/packs/open` per user to e.g., 1/s, and per IP if needed.
* Validate server-side that user actually had eligibility (don’t trust client time).

---

# Asset model & client behavior

* Client requests mask asset by `mask.base_image_ids[color]`. Provide fallbacks:

  1. If `mask_id_glb` exists -> client loads Three.js viewer (deferred).
  2. Else if pre-renders exist -> show frame-swap scroller to fake rotation.
  3. Else show static hero sprite.
* Lazy-load collection thumbnails; prefetch hero for reveal animation once pack open begins.

---

# Testing & QA

Unit & integration tests prioritized:

1. Draw engine unit tests: verify rarity distribution math for many samples (stat checks), pity enforcement after 20 packs.
2. Buff math tests: additive pack_luck sums, clamp to cap.
3. Discovery reroll tests: ensure reroll probability respected and attempts limit enforced.
4. Leveling tests: protodermis accumulation and consumption semantics; edge cases on max_level.
5. Concurrency test: simulate N concurrent open requests for the same user — ensure single success and idempotent behavior.
6. End-to-end: simulate 20 packs to verify at least one rare+ appears.

Instrumentation:

* Emit `pack_open`, `mask_pulled`, `level_up`, `friend_buff_applied` events to `events` table.

---

# Acceptance Criteria (extracted & concrete)

* `POST /api/packs/open` returns exactly N mask objects (2) and persists all changes atomically. (See example payloads in spec). 
* Pity: after 20 packs without rare+, next pack contains at least one rare+ (tests must assert). 
* Buffs: equipping PACK_LUCK masks changes draw rates per compute rules; summed buff <= 20%. 
* Discovery reroll: capped to 3 attempts and 50% effective reroll cap. 
* Turaga = 50% buff effect. 

---

# Performance & Ops notes

* Target pack-open <300ms typical. Preload masks catalog in memory on backend instances for faster sampling rather than DB scanning every open; refresh cache on generation publish. (But always verify final pick & persist with DB.)
* Use connection pooling and short transactions. Keep draw engine pure in-memory with DB writes in transaction after selection.
* Use feature flags for rate tweaks and pack rates A/B testing; `POST /api/admin/set_rates` endpoint guarded by admin role.

---

# Edge decisions to lock (product/engineering)

These are left intentionally flagged. Default choices suggested in spec:

1. Protodermis consumption semantics — choose consume-on-level (we implemented that). 
2. Within-pack uniqueness — allow duplicates (MVP). 
3. Pity threshold — 20 packs (configurable). 
4. Buff stacking math — additive with caps (implemented). 

---

# Developer checklist / Implementation steps (sprint-ready)

1. Schema migrations for tables above + seed `packs.free_daily_v1`.
2. Auth plumbing (Clerk) + `GET /api/me` implementation.
3. Cache masks catalog in memory; admin publish API writes to DB and invalidates caches.
4. Implement `GET /api/packs/status` and `POST /api/packs/open` with transaction + Redis idempotency.
5. Draw engine unit tests and integration tests (pity + buff + discovery + level).
6. Frontend: pack status, opening animation wiring to `POST /api/packs/open`, collection grid, mask detail, equip flow.
7. Friend list MVP + buff aggregation logic.
8. Load testing, observability, and polish.

---

# Appendix — Sample DB query snippets & transactions (pseudo-sql)

Acquire lock & read progress:

```sql
BEGIN;
SELECT * FROM user_pack_progress WHERE user_id = $1 FOR UPDATE;
-- compute eligibility
-- generate draws in app logic
-- upsert user_masks (including appending to unlocked_colors if new color)
UPDATE user_masks 
SET owned_count = owned_count + 1,
    essence = essence + $3,
    unlocked_colors = array_append(unlocked_colors, $4)
WHERE user_id = $1 AND mask_id = $2 AND NOT ($4 = ANY(unlocked_colors));
-- update user_pack_progress, insert events
COMMIT;
```

Sampling masks by rarity (preferential to unowned):

```sql
WITH choices AS (
  SELECT m.mask_id,
         CASE WHEN um.user_id IS NULL THEN 1.0 ELSE 0.2 END AS weight
  FROM masks m
  LEFT JOIN user_masks um ON um.mask_id = m.mask_id AND um.user_id = $1
  WHERE m.base_rarity = $2
)
SELECT mask_id FROM choices ORDER BY random() * (1.0/weight) LIMIT 1;
-- Note: production should do weighted sampling in application code for correctness.
```

---

If you want, I can:

* spit out full SQL migration files for Postgres (DDL),
* write a fully typed TypeScript service skeleton for `POST /api/packs/open` including transaction handling and tests,
* or generate a short checklist for the frontend pack-open animation wire-up.

Which of those would you like first? (Pick one — I'll produce it immediately.)
