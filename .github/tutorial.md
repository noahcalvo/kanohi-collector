## Resumable Tutorial Spec — “Bionicle Origins” (Mask Starter + Common Pack)

### 1) Goal

Implement a **resumable**, step-based tutorial experience that:

1. Explains:

   * what Bionicle are (quick commercial history + lore, written in “Bionicle voice”)
   * the purpose of masks
   * how masks work in *this* game
2. Lets the user **select a starter rare mask** (one of the original 6 Toa masks, in its original color).
3. Grants a **free starter pack** (pack seeded with **commons only**).
4. After tutorial completion, if the user is a **guest**, offers **account creation**.
5. Then redirects to **Home**.
6. Tutorial progress is persisted in DB so user can resume exactly where they left off.
7. If tutorial already completed, user still sees the **explanatory steps**, but **does not** receive another mask or pack.

---

## 2) Definitions

### 2.1 “Original 6 rares” (starter selection list)

The starter selection must offer exactly **six** rare mask options:

* **Hau (Gold)** – Tahu
* **Akaku (Blue)** – Kopaka
* **Kakama (Black)** – Onua
* **Kaukau (White)** – Gali
* **Miru (Green)** – Lewa
* **Pakari (Red)** – Pohatu

> Notes:

* “Original color” here means the classic/toa association color listed above.
* These are “rare” in game rarity terms (not necessarily canon rarity).

### 2.2 Pack seeding rule

The tutorial free pack must be created such that:

* Every card/item in the pack is **COMMON** rarity.
* No rares, uncommons, epics, etc.
* (If your game has “foils” or special variants) tutorial pack must disable those too, unless specifically allowed.

### 2.3 Guest vs Account user

* “Guest” = player has a device/session identity but no registered account.
* Tutorial must work for both.
* If guest completes tutorial, prompt them to create an account (optional/skip allowed).

---

## 3) Data Model

### 3.1 Tables / Entities (minimum required)

#### `tutorial_progress`

Stores the resumable state.

Fields:

* `id` (pk)
* `user_id` (nullable) — set for registered users
* `guest_id` (nullable) — set for guest sessions/devices
* `tutorial_key` (string, e.g. `"bionicle_origins_v1"`)
* `current_step` (string enum; see section 4)
* `completed_at` (timestamp nullable)
* `rare_mask_granted_at` (timestamp nullable)
* `rare_mask_item_id` (fk nullable) — points to inventory item created
* `starter_pack_opened_at` (timestamp nullable)
* `starter_pack_client_request_id` (string nullable) — idempotency key for the open action
* `account_prompt_shown_at` (timestamp nullable)
* `created_at`, `updated_at`

Constraints:

* Unique index on (`tutorial_key`, `user_id`) where `user_id` not null
* Unique index on (`tutorial_key`, `guest_id`) where `guest_id` not null
* Exactly one of `user_id` or `guest_id` must be non-null

#### `inventory_items` (or equivalent)

Must support granting a specific mask item to the player.

Minimum fields needed:

* `id`
* `owner_user_id` or `owner_guest_id`
* `item_type` (e.g. `"mask"`)
* `mask_code` (e.g. `"hau"`, `"akaku"`, etc.)
* `color_code` (e.g. `"gold"`, `"blue"`, etc.)
* `rarity` (must be `"RARE"` for starter mask)
* `source` (e.g. `"tutorial_starter_mask"`)
* `created_at`

#### `packs` (or equivalent)

Represents a pack “to open”.

Minimum fields needed:

* `id`
* `owner_user_id` or `owner_guest_id`
* `pack_type` (e.g. `"tutorial_starter_pack"`)
* `seed_policy` (e.g. `"commons_only"`)
* `opened_at` (nullable)
* `created_at`

#### `pack_contents` (or equivalent)

If you pre-generate contents:

* `pack_id`
* `item_id` or card definition reference
* `rarity`
* `created_at`

---

## 4) Tutorial Flow & Step Enum

### 4.1 Step enum (authoritative list)

Use a string enum so it’s stable across deployments.

1. `INTRO_BIONICLE`
2. `INTRO_MASKS_PURPOSE`
3. `INTRO_GAME_USAGE`
4. `CHOOSE_RARE_MASK`
5. `OPEN_STARTER_PACK`
6. `ACCOUNT_PROMPT` (guest only; registered users auto-skip)
7. `COMPLETE_REDIRECT`

### 4.2 Step gating rules (high level)

* Explanatory steps (1–3) always show.
* `CHOOSE_RARE_MASK`:

  * Only allowed if `rare_mask_granted_at IS NULL`
  * If already granted, skip to next step.
* `OPEN_STARTER_PACK`:

  * Only allowed if `starter_pack_opened_at IS NULL`
  * If already opened, skip to next step.
* Tutorial is considered “complete” when:

  * steps 1–5 done AND
  * if guest: account prompt shown or skipped AND redirect triggered
  * set `completed_at` once user reaches `COMPLETE_REDIRECT`

If `completed_at IS NOT NULL`:

* User still experiences steps 1–3 (and optionally a short “welcome back” message),
* But steps 4 and 5 become **non-granting** “review” versions:

  * show the mask options as “examples” but disabled or “already completed”
  * show the pack opening as “example animation” (optional) but do not create a pack

---

## 5) UX Requirements

### 5.1 Tutorial container page

Route: `/tutorial` (or your chosen route)

The page must:

* Load tutorial progress record from DB
* Determine the **next step** based on current step + grant flags + completion flags
* Render the appropriate step UI
* On “Continue”, persist progress and advance step

### 5.2 Resumability behavior

On page load:

1. Identify actor:

   * If logged in: use `user_id`
   * Else: use `guest_id` from session/device
2. Upsert `tutorial_progress` (create if missing)
3. Compute effective step:

   * If `completed_at` set → start at `INTRO_BIONICLE` (review mode), but ensure no grants.
   * Else if `current_step` exists → resume there, but:

     * if the step is a granting step already granted, auto-advance until a valid step.

### 5.3 Copy requirement (“Bionicle voice”)

Each explanatory step must show themed copy:

**Step 1: INTRO_BIONICLE**

* Contains a quick commercial history:

  * launched as a LEGO theme in early 2000s, story-driven toy line, collectible masks, factions, etc.
* Contains lore vibe:

  * ancient islands, Toa, destiny, awakening, etc.
* Tone: mythic, ceremonial, slightly ominous.

**Step 2: INTRO_MASKS_PURPOSE**

* Explains masks as artifacts that confer powers/roles.
* Teases the six Toa archetypes (without drowning in details).

**Step 3: INTRO_GAME_USAGE**

* Explains how masks work mechanically in your game:

  * (Define your actual mechanics here: equip slot, passive bonus, active ability, durability, crafting, trading, etc.)
* Must be clear, not just flavor.

> Implementation note: put this copy in a `tutorial_copy` module so it’s not hard-coded in the component.

---

## 6) Granting Logic (Critical: Idempotent)

### 6.1 Starter rare mask selection (Step 4)

UI:

* Show the six masks as selectable cards with:

  * mask name
  * associated Toa
  * color
  * short power flavor line (optional)
* Primary CTA: “Claim this Mask”
* Once claimed:

  * show confirmation
  * enable “Continue”

Server/API action: `POST /api/tutorial/claim-rare-mask`

Request:

* `{ tutorialKey, selection: { maskCode } }`

Validation:

* Ensure tutorial progress exists for actor
* If `rare_mask_granted_at` is not null:

  * Return success with existing `rare_mask_item_id` (idempotent behavior)
* Ensure `maskCode` is one of: `hau|akaku|kakama|kaukau|miru|pakari`

Transaction:

1. Create inventory item with:

   * type: mask
   * `mask_code` = chosen
   * `color_code` = original mapping
   * `rarity` = RARE
   * `source` = tutorial
2. Update `tutorial_progress`:

   * set `rare_mask_granted_at = now()`
   * set `rare_mask_item_id = createdItem.id`
   * set `current_step = OPEN_STARTER_PACK` (or next computed)

Response:

* `{ itemId, nextStep }`

### 6.2 Starter pack opening (Step 5)

Single action:

* `POST /api/tutorial/open-starter-pack`

Behavior:

* If tutorial is completed (review mode): return `opened=false` and do not create a real pack open.
* Otherwise:

  * If `starter_pack_opened_at` already set: return success (idempotent/replay) and allow continue.
  * If `starter_pack_client_request_id` is null: generate one and persist it.
  * Create/replay a `PackOpen` keyed by `(user_id, starter_pack_client_request_id)` and return the stored pulls.
  * Update `tutorial_progress`:

   * set `starter_pack_opened_at = now()`
   * advance `current_step` to `ACCOUNT_PROMPT` (guest) or `COMPLETE_REDIRECT` (registered)

---

## 7) Account Prompt (Step 6)

Only for guests.

UI:

* Headline: “Keep your collection.”
* Explain that creating an account saves progress across devices.
* Actions:

  * “Create account” (launch sign-up)
  * “Not now” (skip)

Persist:

* On showing step, set `account_prompt_shown_at` if null.
* On skip, move to `COMPLETE_REDIRECT`.

Important:

* If the user creates an account:

  * Migrate ownership:

    * Update `tutorial_progress.guest_id -> null`, set `user_id`
    * Migrate inventory items and packs to `user_id`
  * Continue to `COMPLETE_REDIRECT`

---

## 8) Completion + Redirect (Step 7)

When entering `COMPLETE_REDIRECT`:

* If `completed_at` is null, set it.
* Then redirect to `/` (home).

If tutorial completed and user re-visits `/tutorial`:

* Start at `INTRO_BIONICLE` in review mode.
* Ensure no grants.
* End still redirects home after final step.

---

## 9) API Surface (summary)

* `GET /api/tutorial/progress?tutorialKey=bionicle_origins_v1`

  * returns progress + computed effective step + whether in review mode
* `POST /api/tutorial/advance`

  * moves from step to step for non-granting steps
* `POST /api/tutorial/claim-rare-mask`
* `POST /api/tutorial/open-starter-pack`

All endpoints must:

* Identify actor (user_id or guest_id)
* Be idempotent with respect to grant actions
* Return `nextStep`

---

## 10) Edge Cases & Rules

1. **User leaves mid-tutorial**

   * On return, they resume at `current_step`, but auto-skip steps that are no longer valid due to already granted items.

2. **User completes tutorial then reloads**

   * No new mask, no new pack.
   * They can replay the explanation steps.

3. **Guest clears cookies / loses guest_id**

   * They’ll be treated as a new guest and start over (unless you have another device fingerprinting strategy; optional).

4. **Race conditions / double-claim**

  * Enforce uniqueness via transaction + checking `rare_mask_granted_at` / `starter_pack_opened_at`.
   * Consider row locking on `tutorial_progress` during claim/grant.

5. **Analytics hooks (optional)**

   * Log events per step: `tutorial_step_viewed`, `rare_mask_claimed`, `starter_pack_opened`, `account_prompt_shown`, `tutorial_completed`.

---

## 11) Deliverables Checklist

* DB migration(s) for `tutorial_progress` + any needed indices
* Tutorial page with step components
* API routes with idempotent grant logic
* Copy module with “Bionicle voice” text
* Integration with inventory + packs system
* Guest → user migration path
* Unit tests:

  * idempotent claims
  * resume logic
  * completed tutorial replay behavior

---

## 12) “Bionicle Voice” Copy (starter draft)

### INTRO_BIONICLE — *What are Bionicles?*

> “In the time before time, the Great Spirit descended from the heavens.”
> — *Bionicle: Mask of Light*

> “Six heroes must rise to face the darkness.”
> — *Bionicle: Mask of Light*

> “They are the Toa.”
> — LEGO.com promotional copy (2001)

Short connective text (non-canon, neutral):

> The BIONICLE story follows the Toa—mechanical heroes awakened to protect their world.

---

### INTRO_MASKS_PURPOSE — *What are masks?*

> “The Kanohi masks are the keys to our power.”
> — *Bionicle Adventures #1: Mystery of Metru Nui*

> “Without our masks, we are weakened.”
> — *Bionicle: Legends of Metru Nui*

> “Each mask grants a different ability.”
> — LEGO.com Kanohi mask guide (early 2000s)

Short connective text:

> Every mask carries a specific power. Wearing one defines what a Toa can do.

---

### INTRO_GAME_USAGE — *How masks work in this game*

Canon anchors (used sparingly):

> “A Toa’s power comes from their Kanohi.”
> — LEGO promotional lore text

> “A Turaga carries wisdom, not strength.”
> — *Bionicle Adventures #4: Tale of the Toa*

Minimal system explanation (plain, factual, non-lore):

> In this game, masks are equipped to shape your pack-opening power.
>
> • **Toa slot** — full power (100%)
> • **Turaga slot** — reduced power (50%)
>
> Masks can reduce pack cooldowns, improve rarity odds, unlock inspection,
> increase chances of new colors, and even boost your friends’ openings.
>
> The goal is simple: **collect, optimize, and flex**.

---

## Implementation Notes

* **Do not paraphrase quotes** — copy exactly as written.
* Keep quotes visually distinct (italic or quotation styling).
* Attribute source subtly (small text or info icon).
* If localization is added later, quotes should remain untranslated unless LEGO-approved text exists.
