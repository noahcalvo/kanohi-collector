# Product Spec — MVP

## Overview / Goals

- Deliver a web-first, mobile-portable MVP where collecting masks is the central loop.
- Fast vertical slice: pack openings, collection UI, leveling via duplicates, minimal social bonuses, no visible currency.
- Assets: 2D sprite-based masks; design asset model so swapping to 3D later is smooth.

## UX Flows (user-facing)

### 1. Onboarding (first run)

- Create account / anonymous local guest option (persist to server when signed in).
- Short tutorial (3 screens): what masks are, packs open, duplicates → levels, equip Toa/Turaga.

### 2. Main screen

- Top: timers / pack progress (1 free pack every 24 hours baseline).
- Middle: equip panel (Toa slot, Turaga slot) with currently equipped masks.
- Large center: "Open Pack" button (enabled only when pack ready).
- Bottom nav: Collection, Friends, Shop/Events (shop minimal, events minimal).

### 3. Pack opening

- Player taps Open Pack (when available). Pack UI animates, reveals 2 masks sequentially (or simultaneously), each has rarity glow + color variant visuals.
- After reveal: if a mask is duplicate, show "+X Protodermis" toast and immediate leveling update if threshold reached.
- If new mask: adds to collection, shows a big reveal card with rotate/zoom on the 2D hero (possible fake rotation with multiple pre-renders later).
- Provide "Equip" and "Close" on reveal card.

### 4. Collection page

- Grid by generation/filter/sort (rarity, owned, new)
- Mask detail page: stats (rarity, level, protodermis pool, buffs), visual (hero), equip button (Toa or Turaga), history of pulls.

### 5. Equip

- Equip only to Toa or Turaga slots. Turaga buffs apply at 50% formula. Cannot equip two of same mask? (Allow duplicates across slots but duplicate buff types blocked — see below.)

### 6. Friends page

- List friends (import/contact/search later, MVP minimal) showing their equipped Toa mask and one-line brag.
- See a small passive bonus icon when a friend is online.
- Friend interactions limited to "view" and "follow" (no trading in MVP).

## Core Data Model (DB tables / key fields)

Use relational DB (Postgres) or document store with equivalent fields.

### Tables / Collections

#### `users`

- `id` (UUID)
- `username`
- `email` (nullable)
- `created_at`
- `last_active_at`
- `settings` (json) — display options, variant toggles
- `friend_ids` (array of UUIDs) OR separate friends table

#### `masks` (master catalog — immutable once published for a generation)

- `mask_id` (string, e.g., 1)
- `generation` (int)
- `name`
- `base_rarity` (enum: COMMON, RARE, MYTHIC)
- `base_color_distribution` (json — standard:80, others:4 each)
- `base_image_ids` (dict of color -> asset ID, or sprite sheet reference)
- `buff_type` (enum: PACK_LUCK, TIMER_SPEED, DUPLICATE_EFF, DISCOVERY, VISUAL)
- `buff_base_value` (float — base per level coefficient)
- `max_level` (int) — see Level caps
- `description`
- `is_unique_mythic` (bool) — true for single signature mythics (Vahi) (still leveled but very slow)

#### `user_masks` (one row per user-mask)

- `id`
- `user_id`
- `mask_id`
- `owned_count` (int) — how many copies pulled
- `essence` (int) — accumulated protodermis (auto from duplicates)
- `level` (int)
- `equipped_slot` (enum: NONE, TOA, TURAGA)
- `unlocked_colors` (array) — list of color variants unlocked for this mask
- `last_acquired_at`

#### `packs` (catalog of pack types — MVP has one free pack type)

- `pack_id` (string)
- `name`
- `masks_per_pack` (2)
- `guaranteed_min_rarity_floor` (COMMON default)
- `featured_generation` (optional)

#### `user_pack_progress`

- `user_id`
- `pack_id`
- `fractional_units` (int) — invisible units collected towards pack
- `last_unit_ts` (timestamp)
- `pity_counter` (int) — masks opened since last rare+

#### `events` (telemetry)

- `event_id`
- `user_id`
- `type`
- `payload`
- `timestamp`

## Asset Model (2D now; 3D-ready)

Master `mask_id` is canonical.

For each mask:
- **2D asset set**: `mask_id_hero.png` (alpha), `mask_id_sprite_sheet.png` (all variants), `mask_id_pre_renders/angle_0..7.png` (optional for fake rotation).
- **Future 3D mapping**: `mask_id_glb` (placeholder URL or null)
- Asset metadata includes pivot point, recommended camera distance, and canonical lighting direction.

All assets referenced by `mask_id` so swapping to 3D is replacing asset references only.

## Pack Drop Algorithm (deterministic logic)

This must be implemented server-side.

### Per mask draw

**Raw probabilities per mask:**
- P(MYTHIC) = 0.005
- P(RARE) = 0.05
- P(COMMON) = 0.945

**Color distribution executed after rarity determined:**
- P(standard_color) = 0.8
- P(each_alt_color) ≈ 0.04

### For 2 masks per pack

1. Draw mask1 using the distribution above.
2. Draw mask2 independently using same distribution.

(Independence is fine for MVP; later you can add no-exact-duplicate-within-pack rules.)

**Quick probabilities:**
- Mythic per pack ≈ 1 - (1 - 0.005)^2 = 0.009975 (~0.9975%).
- At least one rare+ per pack ≈ 1 - (1 - 0.055)^2 = 10.6975%.

### Pity

Track `user_pack_progress.pity_counter` = number of packs opened since last rare+ (rare or mythic).

If `pity_counter >= 20` then for the next pack increase rarities so at least one mask is guaranteed to be Rare or higher; implement by forcing one mask draw to do: sample rarities with chance adjusted to make rare+ guaranteed (i.e. re-roll rarities until rare+ drawn) — then reset `pity_counter` to 0.

Update `pity_counter` on each pack open accordingly.

### Buffs that modify the draw

Buffs (pack luck / discovery) apply before draw by adjusting effective probabilities:

- **Pack luck**: increase P(RARE) and P(MYTHIC) proportionally while decreasing P(COMMON) to keep sum=1.
- **Discovery** (new vs duplicate): use after-draw reroll that favors masks user doesn't own (see "Discovery logic" below).

Buff caps exist system-wide (no more than +20% effective relative boost for any user total across all sources).

#### Example buff application (implementation detail)

Compute `total_pack_luck_bonus` for user (sum of equipped Toa + half Turaga + friend contributions). This is an additive percentage applied to rare+ mass probability:

```
rare_plus_base = 0.055 (rare + mythic combined)
rare_plus_new = rare_plus_base * (1 + total_pack_luck_bonus)
```

Redistribute rarity probabilities proportionally:

Let `scale = rare_plus_new / rare_plus_base`

- P(RARE) = base_RARE * scale 
- P(MYTHIC) = base_MYTHIC * scale (or increase mythic slightly more if you want)
- P(COMMON) = 1 - (P(RARE)+P(MYTHIC))

Ensure probabilities remain in [0,1] and do clamping with a cap (e.g., cannot reduce RARE+ below 0.0001).

*(Engineer note: exact math can vary; keep it normalized and deterministic server-side.)*

## Duplicate → Protodermis → Leveling (rules & formulas)

### Protodermis from pulls

When a mask is pulled and user already owns at least one copy:

```
essence_awarded = 100
```

Add `essence_awarded` to `user_masks.essence` (protodermis pool).

### Level Up formula

```
RequiredProtodermisToLevelUp(current_level, rarity) = base_by_rarity * current_level
```

**base:**
- For all rarities = 500

**Examples:**
- COMMON Level 1→2: 500 × 1 = 500 protodermis
- COMMON Level 2→3: 500 * 2 = 10 protodermis
- COMMON Level 3→4: 500 × 3 = 1500 protodermis
- RARE Level 1→2: 500 × 1 = 500 protodermis (≈5 duplicates)
- MYTHIC Level 1→2: 500 × 1 = 500 protodermis (≈4 duplicates)

Implementation: Store current_level and check if protodermis (essence field) >= base * current_level, then deduct and increment level. Repeat until not enough protodermis or max_level reached.

### max_level

- COMMON: 10
- RARE: 5
- MYTHIC: 3 (can be adjusted; mythic leveling intentionally hard)

### On level up

- Deduct the required protodermis (or keep cumulative semantics — choose one). MVP: consume protodermis when leveling (reduces runaway).
- Recompute `user_masks.level` and persist.

### Buff scaling by level

Each mask defines `buff_type` and `buff_base_value` (per-level multiplier).

**Effective buff value:**
- For Toa slot: `effective = buff_base_value * level`
- For Turaga slot: `effective = 0.5 * buff_base_value * level`

**Example buff base values:**
- PACK_LUCK: COMMON base=0.1% (0.001), RARE base=0.25% (0.0025), MYTHIC base=1% (0.01)

So a RARE mask at level 4 gives 0.0025 * 4 = 0.01 = +1% pack luck.

Global caps: total pack luck from all sources <= 20% (0.20) to avoid extreme rates.

*(Engineer: store `buff_base_value` in masks for direct calculation.)*

## Discovery logic (favor new masks)

After a mask is drawn by rarity + color, do a "discovery check": if `user_masks` does not contain that `mask_id`, treat as new; else it's duplicate.

If the user has Discovery buffs, then with some probability you can attempt to re-roll duplicates into new mask draws of the same rarity pool:

```
probability_of_reroll = min(DiscoveryBonus, 0.5) — cap at 50% chance to reroll a duplicate.
```

If reroll triggers, sample again from same rarity but prefer masks user does not own.

**Implementation note:** discovery rerolls must eventually stop after X attempts to avoid infinite loops (MVP limit 3 attempts).

## Friend System (MVP)

Friends are optional. Minimal integration:

- `friends` table / `user.friend_ids`.
- Each friend who is "nearby/online" or in friend list contributes a small passive buff if they have an equipped mask with `buff_type == PACK_LUCK` or similar.
- **friend_buff_per_friend example:** +0.25% pack luck (0.0025) per friend with such equipped mask.
- **Cap:** count up to 5 friends to apply buff (max friend buff e.g., +1.25%).
- **Visual:** show friend badge with their equipped Toa mask and small buff icon.
- Friend effects only additive and small; allow toggles to disable friend buffs in settings.

## Timers & Pack Units (Invisible currency)

**Default:** 1 free pack every 24 hours (86400 seconds). Implement as:

- `user_pack_progress.fractional_units` & `pack_unit_rate_seconds` (e.g., 86400 seconds per pack unit * 5 units = 1 pack if modeled as units).

**Simpler MVP:** store `last_pack_claim_ts`. When a user claims, set `last_pack_claim_ts = now` and compute `next_eligible_time = last_pack_claim_ts + 24h` (modified by TimerSpeed buffs).

But to support fractional/invisible units (for future currency), use the `fractional_units` approach where:
- `pack_unit_tick`: the system grants 1 unit per `pack_unit_seconds` (e.g., base 86400/5 = 17280s per unit if a pack = 5 units). Store fractional progress to allow masks to speed timer by % (reduce seconds per unit).

**MVP implement:** single visible free pack + hidden fractional units to allow buffs like "+20% timer speed".

*(Engineer: pick one — visible simplicity or fractional; I recommend fractional internally but present a single timer to user.)*

## API Endpoints (REST style; server authoritative)

### Account

- `GET /api/me` -> user payload + equipped masks + collection summary

### Packs

- `GET /api/packs/status` -> {pack_ready: bool, time_to_ready: seconds, fractional_units}
- `POST /api/packs/open` -> server validates eligibility, deducts units, runs draw algorithm, returns open_result with mask details, essence awarded, level changes, updated collection. Persists events.

### Collection

- `GET /api/collection?filter=...` -> list of user_masks (paginated)
- `GET /api/mask/{mask_id}` -> mask details + user-specific data
- `POST /api/mask/{mask_id}/equip` {slot: TOA|TURAGA|NONE} -> server validates and sets equipped_slot

### Friends

- `GET /api/friends` -> list
- `POST /api/friends/invite` -> invite flow
- `GET /api/friends/{id}` -> friend detail + equipped mask preview

### Telemetry / Events

- `POST /api/events` -> log custom events (client may emit pulls/openings for analytics)

### Admin (internal)

- `POST /api/admin/publish_generation` -> upload masks entries for a generation
- `POST /api/admin/set_rates` -> adjust rare/mythic rates (for A/B testing)

## Acceptance criteria / QA scenarios (must pass)

### Pack open

Given pack ready, `POST /api/packs/open` returns 2 mask objects, correctly persisted to user_masks, duplicate case yields essence amounts, level-ups computed and persisted.

### Rarity distribution

Over a large simulated sample, rarity frequencies match configured probabilities within statistical noise; pity guarantees Rare+ at least once in any 20-pack window.

### Equip

Equipping a mask to Toa or Turaga updates effective buffs immediately (server-side), Turaga applies exactly 50% effect.

### Buffs affect draws

With an equipped PACK_LUCK mask (e.g., +1% effective), server alters probabilities accordingly and pack draws reflect increased rare+ incidence over samples.

### Discovery reroll

When Discovery buff present and duplicate drawn, reroll will attempt up to 3 times to find an unowned mask of same rarity before returning duplicate.

### Friend buff

Adding friends results in small passive buff capped at 5 friends; buff persists across sessions and is visible in user's stat summary.

### No visible currency

No coin balance appears in UI; fractional pack units remain internal and not exposed.

### Assets

Collection UI displays correct asset per mask_id and color variant; pre-renders or sprite sheets load without layout shift.

## Non-functional requirements

- **Client:** React (or Next.js) front-end that is mobile responsive. Keep rendering lightweight; defer heavy loads.
- **Assets:** Serve sprites via CDN with caching. Use lazy loading on collection.
- **Server:** Node.js/Go/Python backend, stateless scaled processes, Postgres DB. All draw logic must be server-side for anti-cheat.
- **Latency:** Pack open response < 300ms typical; prewarm random seeds if needed.
- **Security:** Auth tokens, rate limits on pack open (prevent abuse), server validation of friend/buff state.
- **Observability:** Log events for opens, rare pulls, level-ups and friend contributions for analytics.

## Migration paths (future-proofing — minimal lift)

### Add visible currency later

Keep `pack_unit` internal model. When adding coins, expose a new wallet field and implement `POST /api/wallet/convert_units` that converts internal units to coins.

Make masks able to "sell" for pack units by implementing `POST /api/mask/{id}/sell` -> consumes mask copies and adds fractional units or coins.

### Add 3D mask viewer later

Asset model uses `mask_id`. When 3D ready, `mask_id` will point to `mask_id_glb`. Client chooses renderer based on presence of 3D asset:

- If `mask.glb` exists: use Three.js/Babylon.js view.
- Else if pre-renders present: use scrubbable frame-swap viewer.
- Else render 2D hero.

## Implementation plan & milestones (suggested)

### Data + API skeleton (2 weeks)

Implement DB schemas for masks, user_masks, packs, user_pack_progress, events. Implement authentication.

### Pack open + draw engine (2 weeks)

Server-side draw logic, pity, duplicate → essence, level logic. Expose packs/open endpoint; build basic pack UI.

### Collection UI & equip flow (1.5 weeks)

Collection grid, mask detail, equip actions, buff calculations applied to GET /api/me.

### Friend list + passive buff (1 week)

Basic friend add/view; friend buff aggregation.

### Telemetry & QA + polish (1.5 weeks)

Acceptance tests, event logging, perform stats to verify rates.

### Soft launch build + instrumentation (1 week)

Release web MVP, gather metrics.

*(Adjust times for team size — these are sprint estimates for a small 2–3 engineer team.)*

## Open implementation choices to lock (decisions engineer/product should finalize quickly)

- Exact essence consumption semantics (cumulative vs consume-on-level). (Spec chooses consume-on-level.)
- Whether within-pack uniqueness is enforced. (MVP: allow duplicates across the two masks.)
- Pity threshold exact value (spec uses 20 packs).
- Buff stacking math: additive vs multiplicative. (Spec uses additive with global caps.)

## Example JSON payloads

### POST /api/packs/open response

```json
{
    "user_id": "uuid-123",
    "pack_id": "free_daily_v1",
    "masks": [
        {
            "mask_id": "1",
            "name": "Toa Mask 3",
            "rarity": "RARE",
            "color": "standard",
            "is_new": true,
            "essence_awarded": 0,
            "level_before": 0,
            "level_after": 0
        },
        {
            "mask_id": "1",
            "name": "Matoran Mask 1",
            "rarity": "COMMON",
            "color": "alt_blue",
            "is_new": false,
            "essence_awarded": 1,
            "level_before": 1,
            "level_after": 1
        }
    ],
    "pity_counter": 0,
    "next_pack_ready_in_seconds": 86400
}
```

## Testing checklist (dev & QA)

- Unit tests for draw engine covering buffs and pity.
- Integration tests: open 20 packs for a seed user -> confirm at least 1 rare+ by pity logic.
- Load test packs/open under concurrent use to ensure RNG & DB transactions safe (IDEMPOTENT semantics for pack opening).
- Visual regression for 2D assets, pre-renders and color variants.

## Final notes / design rationales (short)

- **2 masks per pack** given your rarity rates preserves dopamine without making mythics trivial. It brings mythic-per-pack to ≈1% (nearly double single-mask baseline).
- **No visible currency** keeps the core loop pure and lowers design surface; we still track fractional units internally to enable seamless currency later.
- **Toa+Turaga equip** preserves lore and simple balancing (Toa=100%, Turaga=50%).
- **Server-side draws** are non-negotiable for fairness and analytics.
- **3D-ready asset model** stops you from reworking catalog logic later — swap art, keep IDs.