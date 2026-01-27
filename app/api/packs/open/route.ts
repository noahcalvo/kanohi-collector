import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getUserId } from "../../../../lib/auth";
import { prisma } from "../../../../lib/db/prisma";
import { openPack } from "../../../../lib/engine";
import { masks as maskDefs } from "../../../../lib/staticData";
import { createPrismaStore } from "../../../../lib/store/prismaStore";

const schema = z.object({
  pack_id: z.string(),
  client_request_id: z.string().uuid(),
});

const PACK_ID = "free_daily_v1";
const PER_USER_RATE_LIMIT_WINDOW_MS = 1_000;

function buildReplayResponse(pulls: any[], pityCounterAfter: number) {
  const byId = new Map(maskDefs.map((m) => [m.mask_id, m] as const));
  return {
    masks: pulls
      .sort((a, b) => a.idx - b.idx)
      .map((p) => {
        const def = byId.get(p.maskId);
        return {
          mask_id: p.maskId,
          name: def?.name ?? p.maskId,
          rarity: p.rarity,
          color: p.color,
          is_new: p.isNew,
          was_color_new: p.wasColorNew,
          essence_awarded: p.essenceAwarded,
          essence_remaining: p.essenceRemaining,
          final_essence_remaining: p.finalEssenceRemaining,
          level_before: p.levelBefore,
          level_after: p.levelAfter,
          final_level_after: p.finalLevelAfter,
          unlocked_colors: p.unlockedColors,
          transparent: def?.transparent,
        };
      }),
    pity_counter: pityCounterAfter,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.parse(body);
    const { userId, isGuest } = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (parsed.pack_id !== PACK_ID) {
      return NextResponse.json({ error: "Unknown pack" }, { status: 400 });
    }

    // We model pack opens as a domain event in Postgres and use
    // (user_id, client_request_id) as the idempotency key.

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const store = createPrismaStore(tx);
      const user = await store.getOrCreateUser(isGuest, userId);

      // 1) Idempotency: if we've already recorded a pack open for this key, replay it.
      const existing = await tx.packOpen.findUnique({
        where: {
          userId_clientRequestId: {
            userId: user.id,
            clientRequestId: parsed.client_request_id,
          },
        },
        select: { id: true, pityCounterAfter: true },
      });

      if (existing) {
        const pulls = await tx.packOpenPull.findMany({
          where: { packOpenId: existing.id },
        });
        return buildReplayResponse(pulls, existing.pityCounterAfter ?? 0);
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
      let packOpenRow;
      try {
        packOpenRow = await tx.packOpen.create({
          data: {
            userId: user.id,
            packId: parsed.pack_id,
            clientRequestId: parsed.client_request_id,
            seed,
          },
          select: { id: true },
        });
      } catch (e) {
        console.log("[packOpen] - race detected on idempotency key insert", e);
        // If another request won the race, replay from the DB.
        const raced = await tx.packOpen.findUnique({
          where: {
            userId_clientRequestId: {
              userId: user.id,
              clientRequestId: parsed.client_request_id,
            },
          },
          select: { id: true, pityCounterAfter: true },
        });
        if (!raced) throw e;
        const pulls = await tx.packOpenPull.findMany({
          where: { packOpenId: raced.id },
        });
        return buildReplayResponse(pulls, raced.pityCounterAfter ?? 0);
      }

      // 4) Run the server-side draw + persistence using the same transaction.
      const openResult = await openPack(
        isGuest,
        userId,
        parsed.pack_id,
        { seed },
        store,
      );

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
    });

    return NextResponse.json(result);
  } catch (err) {
    const statusCode =
      typeof err === "object" && err && "statusCode" in err
        ? Number((err as any).statusCode)
        : 400;
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
