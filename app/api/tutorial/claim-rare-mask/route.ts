import { z } from "zod";
import { getRequestId, jsonError, jsonOk, startRouteSpan } from "@/lib/api/routeUtils";
import { getOrCreateUserId, setGuestCookie } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { createPrismaStore } from "@/lib/store/prismaStore";
import { TUTORIAL_KEY } from "@/lib/tutorial/constants";
import {
  computeTutorialStateForResponse,
  lockTutorialProgress,
  tutorialKeySchema,
  upsertTutorialProgress,
} from "@/lib/tutorial/server";
import {
  getStarterMaskRenderInfo,
  isStarterMaskId,
  STARTER_MASK_IDS,
  type StarterMaskId,
} from "@/lib/tutorial/starterMasks";

const bodySchema = z.object({
  tutorialKey: tutorialKeySchema.optional().default(TUTORIAL_KEY),
  selection: z.object({
    maskId: z.enum(["1", "2", "3", "4", "5", "6"]),
  }),
});

export async function POST(req: Request) {
  const requestId = getRequestId(req);
  const span = startRouteSpan("POST /api/tutorial/claim-rare-mask", requestId);
  try {
    const body = bodySchema.parse(await req.json());

    const actor = await getOrCreateUserId();
    if (actor.setCookie) setGuestCookie(actor.userId);

    const result = await prisma.$transaction(async (tx) => {
      const store = createPrismaStore(tx);
      const user = await store.getOrCreateUser(actor.isGuest, actor.userId);

      const base = await upsertTutorialProgress(tx, {
        userId: user.id,
        tutorialKey: body.tutorialKey,
      });
      await lockTutorialProgress(tx, base.id);

      const locked = await (tx as any).tutorialProgress.findUniqueOrThrow({
        where: { id: base.id },
      });

      // Idempotency: if already granted (or tutorial completed), never grant again.
      if (locked.completedAt || locked.rareMaskGrantedAt) {
        return {
          user_id: user.id,
          is_guest: actor.isGuest,
          ...computeTutorialStateForResponse(locked, actor.isGuest),
          next_step: computeTutorialStateForResponse(locked, actor.isGuest)
            .effective_step,
        };
      }

      const selectedMaskId = body.selection.maskId;
      if (!isStarterMaskId(selectedMaskId)) {
        throw new Error(
          `Invalid starter mask id: ${selectedMaskId}. Expected one of ${STARTER_MASK_IDS.join(",")}`,
        );
      }
      const choice = getStarterMaskRenderInfo(selectedMaskId as StarterMaskId);
      const grantColor = choice.originalColor;
      const now = new Date();

      const existing = await tx.userMask.findUnique({
        where: {
          userId_maskId: { userId: user.id, maskId: choice.maskId },
        },
        select: { unlockedColors: true },
      });
      const unlocked = existing?.unlockedColors ?? [];
      const mergedUnlocked = unlocked.includes(grantColor)
        ? unlocked
        : [...unlocked, grantColor];

      await tx.userMask.upsert({
        where: {
          userId_maskId: { userId: user.id, maskId: choice.maskId },
        },
        create: {
          userId: user.id,
          maskId: choice.maskId,
          ownedCount: 1,
          essence: 0,
          level: 1,
          equippedSlot: "NONE",
          unlockedColors: [grantColor],
          equippedColor: grantColor,
          lastAcquiredAt: now,
        },
        update: {
          ownedCount: { increment: 1 },
          unlockedColors: mergedUnlocked,
          equippedColor: grantColor,
          lastAcquiredAt: now,
        },
      });

      const updated = await (tx as any).tutorialProgress.update({
        where: { id: locked.id },
        data: {
          rareMaskGrantedAt: now,
          rareMaskMaskId: choice.maskId,
          currentStep: "OPEN_STARTER_PACK",
        },
      });

      return {
        user_id: user.id,
        is_guest: actor.isGuest,
        granted: {
          mask_id: choice.maskId,
          name: choice.name,
          color: grantColor,
        },
        ...computeTutorialStateForResponse(updated, actor.isGuest),
        next_step: "OPEN_STARTER_PACK",
      };
    });

    span.ok({ status: 200, isGuest: actor.isGuest });
    return jsonOk(result, requestId);
  } catch (err) {
    const status = err instanceof z.ZodError ? 400 : 500;
    const message =
      status === 400
        ? err instanceof Error
          ? err.message
          : "Invalid request"
        : "Internal server error";
    span.error(err, { status });
    return jsonError(message, status, requestId);
  }
}
