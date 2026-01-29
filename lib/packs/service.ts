import type { Prisma } from "@prisma/client";
import { openPackForUser } from "@/lib/engine";
import { log } from "@/lib/logger";
import { buildOpenResultReplay } from "@/lib/packs/replay";
import { createPrismaStore } from "@/lib/store/prismaStore";
import type { OpenResult } from "@/lib/types";

export type PackActor = {
  isGuest: boolean;
  userId: string;
};

const PER_USER_RATE_LIMIT_WINDOW_MS = 1_000;

export async function openPackPayload(
  tx: Prisma.TransactionClient,
  actor: PackActor,
  args: {
    packId: string;
    clientRequestId: string;
    requestId?: string;
  },
): Promise<OpenResult> {
  const store = createPrismaStore(tx);
  const user = await store.getOrCreateUser(actor.isGuest, actor.userId);

  // 1) Idempotency: if we've already recorded a pack open for this key, replay it.
  const existing = await tx.packOpen.findUnique({
    where: {
      userId_clientRequestId: {
        userId: user.id,
        clientRequestId: args.clientRequestId,
      },
    },
    select: { id: true, pityCounterAfter: true },
  });

  if (existing) {
    const pulls = await tx.packOpenPull.findMany({
      where: { packOpenId: existing.id },
    });
    return buildOpenResultReplay(pulls, existing.pityCounterAfter ?? 0);
  }

  // 2) Simple per-user rate limit (best-effort): reject burst spam.
  const windowStart = new Date(Date.now() - PER_USER_RATE_LIMIT_WINDOW_MS);
  const recent = await tx.packOpen.findFirst({
    where: {
      userId: user.id,
      createdAt: { gt: windowStart },
    },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  if (recent) {
    throw Object.assign(new Error("Too many requests"), { statusCode: 429 });
  }

  // 3) Reserve the idempotency key by inserting a PackOpen row.
  // Seed is server-generated; stored for audit/debug.
  const seed = `${user.id}-${Date.now()}-${process.env.GLOBAL_SEED_SALT ?? "kanohi-server-salt"}`;
  let packOpenRow: { id: string };
  try {
    packOpenRow = await tx.packOpen.create({
      data: {
        userId: user.id,
        packId: args.packId,
        clientRequestId: args.clientRequestId,
        seed,
      },
      select: { id: true },
    });
  } catch (e) {
    log.warn("[packOpen] race detected on idempotency key insert", {
      requestId: args.requestId,
    });

    // If another request won the race, replay from the DB.
    const raced = await tx.packOpen.findUnique({
      where: {
        userId_clientRequestId: {
          userId: user.id,
          clientRequestId: args.clientRequestId,
        },
      },
      select: { id: true, pityCounterAfter: true },
    });
    if (!raced) throw e;

    const pulls = await tx.packOpenPull.findMany({
      where: { packOpenId: raced.id },
    });
    return buildOpenResultReplay(pulls, raced.pityCounterAfter ?? 0);
  }

  // 4) Run the server-side draw + persistence using the same transaction.
  const openResult = await openPackForUser(user, args.packId, { seed }, store);

  // 5) Persist pulls for deterministic replay.
  await tx.packOpenPull.createMany({
    data: openResult.masks.map((m, idx) => ({
      packOpenId: packOpenRow.id,
      idx,
      maskId: m.mask_id,
      rarity: m.rarity,
      color: m.color,
      isNew: m.is_new,
      wasColorNew: m.was_color_new,
      essenceAwarded: m.essence_awarded,
      essenceRemaining: m.essence_remaining,
      finalEssenceRemaining: m.final_essence_remaining,
      levelBefore: m.level_before,
      levelAfter: m.level_after,
      finalLevelAfter: m.final_level_after,
      unlockedColors: m.unlocked_colors,
    })),
  });
  await tx.packOpen.update({
    where: { id: packOpenRow.id },
    data: { pityCounterAfter: openResult.pity_counter },
  });

  return openResult;
}
