# Kanohi Collector (MVP skeleton)

This repository mirrors the provided design/spec: Next.js frontend with server-side pack logic implementing pity, buffs, discovery rerolls, and leveling via duplicates.

## Getting started

1) Install deps

```bash
yarn install
```

2) Configure env

- Copy `.env.example` to `.env.local`
- Fill in Clerk keys + `DATABASE_URL`

3) Generate Prisma client and run migrations

```bash
yarn prisma:generate
yarn prisma:migrate
```

4) Run the dev server

```bash
yarn dev
```

Then open http://localhost:3000. You’ll be redirected to Clerk sign-in, then the UI shows pack status and lets you open the daily pack.

## Tests

```bash
npm test
```

Vitest covers pack open consumption, pity guarantee, and equip slot exclusivity.

## API routes (app router)

- `GET /api/packs/status` — returns pack readiness, fractional units, pity counter.
- `POST /api/packs/open` — opens `free_daily_v1` pack (idempotent per user).
- `GET /api/me` — user summary with buffs and collection data.
- `POST /api/mask/{mask_id}/equip` — equip mask into `TOA|TURAGA|NONE` (one per slot).

## Engine highlights

- Rarity math and buffs with 20% pack luck cap.
- Pity after 20 packs guarantees at least one rare+ item in next pack.
- Discovery rerolls up to 3 attempts, capped at 50% probability.
- Duplicate protodermis and leveling with consumptive costs per rarity.
- DB-backed user state via Prisma + Postgres.
- Default pack cooldown is 12 hours (configurable via `PACK_UNIT_SECONDS`).

## Next steps

- Add friend persistence + buffs (currently treated as 0 in the DB-backed MVP).
- Move idempotency cache from in-memory Map to Redis/Upstash for multi-instance deployments.
- Flesh out collection/equip UI and asset rendering per spec.
- Add more unit/integration tests (rarity distribution stats, concurrency guard).
