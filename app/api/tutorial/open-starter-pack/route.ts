import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getOrCreateUserId, setGuestCookie } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { openTutorialCommonsOnlyPack } from "@/lib/engine";
import { masks as maskDefs } from "@/lib/staticData";
import { createPrismaStore } from "@/lib/store/prismaStore";
import { TUTORIAL_KEY } from "@/lib/tutorial/constants";
import {
  computeTutorialStateForResponse,
  lockTutorialProgress,
  tutorialKeySchema,
  upsertTutorialProgress,
} from "@/lib/tutorial/server";

const bodySchema = z.object({
  tutorialKey: tutorialKeySchema.optional().default(TUTORIAL_KEY),
});

const PACK_ID = "tutorial_starter_pack_v1";

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

export async function POST(req: Request) {
  try {
    const body = bodySchema.parse(await req.json().catch(() => ({})));

    const actor = await getOrCreateUserId();
    if (actor.setCookie) setGuestCookie(actor.userId);

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const store = createPrismaStore(tx);
      const user = await store.getOrCreateUser(actor.isGuest, actor.userId);

      const base = await upsertTutorialProgress(tx, {
        userId: user.id,
        tutorialKey: body.tutorialKey,
      });
      await lockTutorialProgress(tx, base.id);

      const progress = await (tx as any).tutorialProgress.findUniqueOrThrow({
        where: { id: base.id },
      });

      if (progress.completedAt) {
        // Review mode: do not open a real pack.
        return {
          user_id: user.id,
          is_guest: actor.isGuest,
          ...computeTutorialStateForResponse(progress, actor.isGuest),
          opened: false,
          results: null,
        };
      }

      if (!progress.starterPackClientRequestId || !progress.starterPackGrantedAt) {
        throw new Error("Starter pack not granted");
      }

      // Idempotency: PackOpen is keyed by (user_id, client_request_id).
      const existing = await tx.packOpen.findUnique({
        where: {
          userId_clientRequestId: {
            userId: user.id,
            clientRequestId: progress.starterPackClientRequestId,
          },
        },
        select: { id: true, pityCounterAfter: true },
      });

      if (existing) {
        const pulls = await tx.packOpenPull.findMany({
          where: { packOpenId: existing.id },
        });
        const now = new Date();
        const updatedProgress = progress.starterPackOpenedAt
          ? progress
          : await (tx as any).tutorialProgress.update({
              where: { id: progress.id },
              data: {
                starterPackOpenedAt: now,
                currentStep: actor.isGuest ? "ACCOUNT_PROMPT" : "COMPLETE_REDIRECT",
                accountPromptShownAt:
                  actor.isGuest && !progress.accountPromptShownAt
                    ? now
                    : progress.accountPromptShownAt,
              },
            });

        return {
          user_id: user.id,
          is_guest: actor.isGuest,
          ...computeTutorialStateForResponse(updatedProgress, actor.isGuest),
          opened: true,
          results: buildReplayResponse(pulls, existing.pityCounterAfter ?? 0),
        };
      }

      const seed = `${user.id}-${Date.now()}-${process.env.GLOBAL_SEED_SALT ?? "kanohi-server-salt"}-tutorial`;

      let packOpenRow;
      try {
        packOpenRow = await tx.packOpen.create({
          data: {
            userId: user.id,
            packId: PACK_ID,
            clientRequestId: progress.starterPackClientRequestId,
            seed,
          },
          select: { id: true },
        });
      } catch (e) {
        // Race: if another request created it first, replay.
        const raced = await tx.packOpen.findUnique({
          where: {
            userId_clientRequestId: {
              userId: user.id,
              clientRequestId: progress.starterPackClientRequestId,
            },
          },
          select: { id: true, pityCounterAfter: true },
        });
        if (!raced) throw e;
        const pulls = await tx.packOpenPull.findMany({
          where: { packOpenId: raced.id },
        });
        return {
          user_id: user.id,
          is_guest: actor.isGuest,
          ...computeTutorialStateForResponse(progress, actor.isGuest),
          opened: true,
          results: buildReplayResponse(pulls, raced.pityCounterAfter ?? 0),
        };
      }

      const openResult = await openTutorialCommonsOnlyPack(
        actor.isGuest,
        actor.userId,
        { seed, pulls: 2 },
        store,
      );

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

      const now = new Date();
      const updatedProgress = await (tx as any).tutorialProgress.update({
        where: { id: progress.id },
        data: {
          starterPackOpenedAt: now,
          currentStep: actor.isGuest ? "ACCOUNT_PROMPT" : "COMPLETE_REDIRECT",
          accountPromptShownAt:
            actor.isGuest && !progress.accountPromptShownAt
              ? now
              : progress.accountPromptShownAt,
        },
      });

      return {
        user_id: user.id,
        is_guest: actor.isGuest,
        ...computeTutorialStateForResponse(updatedProgress, actor.isGuest),
        opened: true,
        results: openResult,
      };
    });

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
