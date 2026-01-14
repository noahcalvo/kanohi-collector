# Kanohi Collector (MVP skeleton)

This repository mirrors the provided design/spec: Next.js frontend with server-side pack logic (in-memory for now) implementing pity, buffs, discovery rerolls, and leveling via duplicates.

## Getting started

```bash
npm install
npm run dev
```

Then open http://localhost:3000. The UI shows pack status and lets you open the daily pack (stub user `user-1`).

## Tests

```bash
npm test
```

Vitest covers pack open consumption, pity guarantee, and equip slot exclusivity.

## API routes (app router)

- `GET /api/packs/status` — returns pack readiness, fractional units, pity counter.
- `POST /api/packs/open` — opens `free_daily_v1` pack (server-side engine, idempotency placeholder).
- `GET /api/me` — user summary with buffs and collection data.
- `POST /api/mask/{mask_id}/equip` — equip mask into `TOA|TURAGA|NONE` (one per slot).

## Engine highlights

- Rarity math and buffs with 20% pack luck cap.
- Pity after 20 packs guarantees at least one rare+ item in next pack.
- Discovery rerolls up to 3 attempts, capped at 50% probability.
- Duplicate protodermis and leveling with consumptive costs per rarity.
- In-memory store with `resetStore()` for tests; swap with Postgres/Redis per design doc.

## Next steps

- Replace in-memory store with Postgres + Redis idempotency/rate limits.
- Wire Clerk auth and real user context.
- Flesh out collection/equip UI and asset rendering per spec.
- Add more unit/integration tests (rarity distribution stats, concurrency guard).
