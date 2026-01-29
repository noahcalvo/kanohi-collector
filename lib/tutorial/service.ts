import { randomUUID } from "crypto";
import type { Prisma } from "@prisma/client";
import { openTutorialCommonsOnlyPack } from "@/lib/engine";
import { buildOpenResultReplay } from "@/lib/packs/replay";
import { createPrismaStore } from "@/lib/store/prismaStore";
import {
  computeTutorialStateForResponse,
  lockTutorialProgress,
  upsertTutorialProgress,
} from "@/lib/tutorial/server";
import {
  getStarterMaskRenderInfo,
  isStarterMaskId,
  STARTER_MASK_IDS,
  type StarterMaskId,
} from "@/lib/tutorial/starterMasks";
import { computeNextStep } from "@/lib/tutorial/stepEngine";

const TUTORIAL_STARTER_PACK_ID = "tutorial_starter_pack_v1";

export type TutorialActor = {
  isGuest: boolean;
  userId: string;
};

async function getOrCreateTutorialUser(
  tx: Prisma.TransactionClient,
  actor: TutorialActor,
) {
  const store = createPrismaStore(tx);
  const user = await store.getOrCreateUser(actor.isGuest, actor.userId);
  return { store, user };
}

export async function getTutorialProgressPayload(
  tx: Prisma.TransactionClient,
  actor: TutorialActor,
  tutorialKey: string,
) {
  const { user } = await getOrCreateTutorialUser(tx, actor);
  const progress = await upsertTutorialProgress(tx, {
    userId: user.id,
    tutorialKey,
  });

  return {
    user_id: user.id,
    is_guest: actor.isGuest,
    ...computeTutorialStateForResponse(progress, actor.isGuest),
  };
}

export async function advanceTutorialPayload(
  tx: Prisma.TransactionClient,
  actor: TutorialActor,
  tutorialKey: string,
) {
  const { user } = await getOrCreateTutorialUser(tx, actor);

  const base = await upsertTutorialProgress(tx, {
    userId: user.id,
    tutorialKey,
  });
  await lockTutorialProgress(tx, base.id);

  const locked = await (tx as any).tutorialProgress.findUniqueOrThrow({
    where: { id: base.id },
  });

  const reviewMode = Boolean(locked.completedAt);
  const rareGranted = Boolean(locked.rareMaskGrantedAt);
  const packOpened = Boolean(locked.starterPackOpenedAt);

  const effective = computeTutorialStateForResponse(locked, actor.isGuest);
  const computedNextStep = computeNextStep(effective.effective_step, {
    isGuest: actor.isGuest,
    reviewMode,
    rareGranted,
    packOpened,
  });

  const nextStep =
    reviewMode && effective.effective_step === "CHOOSE_RARE_MASK"
      ? "OPEN_STARTER_PACK"
      : computedNextStep;

  const now = new Date();
  const updates: any = {
    currentStep: nextStep,
  };

  if (nextStep === "ACCOUNT_PROMPT" && actor.isGuest) {
    if (!locked.accountPromptShownAt) updates.accountPromptShownAt = now;
  }

  const updated = await (tx as any).tutorialProgress.update({
    where: { id: locked.id },
    data: updates,
  });

  return {
    user_id: user.id,
    is_guest: actor.isGuest,
    ...computeTutorialStateForResponse(updated, actor.isGuest),
    next_step: nextStep,
  };
}

export async function claimRareMaskPayload(
  tx: Prisma.TransactionClient,
  actor: TutorialActor,
  tutorialKey: string,
  selectionMaskId: string,
) {
  const { user } = await getOrCreateTutorialUser(tx, actor);

  const base = await upsertTutorialProgress(tx, {
    userId: user.id,
    tutorialKey,
  });
  await lockTutorialProgress(tx, base.id);

  const locked = await (tx as any).tutorialProgress.findUniqueOrThrow({
    where: { id: base.id },
  });

  if (locked.completedAt || locked.rareMaskGrantedAt) {
    const effective = computeTutorialStateForResponse(locked, actor.isGuest);
    return {
      user_id: user.id,
      is_guest: actor.isGuest,
      ...effective,
      next_step: effective.effective_step,
    };
  }

  if (!isStarterMaskId(selectionMaskId)) {
    throw new Error(
      `Invalid starter mask id: ${selectionMaskId}. Expected one of ${STARTER_MASK_IDS.join(",")}`,
    );
  }

  const choice = getStarterMaskRenderInfo(selectionMaskId as StarterMaskId);
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
}

export async function completeTutorialPayload(
  tx: Prisma.TransactionClient,
  actor: TutorialActor,
  tutorialKey: string,
) {
  const { user } = await getOrCreateTutorialUser(tx, actor);

  const base = await upsertTutorialProgress(tx, {
    userId: user.id,
    tutorialKey,
  });
  await lockTutorialProgress(tx, base.id);

  const locked = await (tx as any).tutorialProgress.findUniqueOrThrow({
    where: { id: base.id },
  });

  const firstTimeCompleted = locked.completedAt === null;

  const now = new Date();
  const updated = await (tx as any).tutorialProgress.update({
    where: { id: locked.id },
    data: {
      completedAt: locked.completedAt ?? now,
      currentStep: "INTRO_BIONICLE",
    },
  });

  return {
    user_id: user.id,
    is_guest: actor.isGuest,
    first_time_completed: firstTimeCompleted,
    ...computeTutorialStateForResponse(updated, actor.isGuest),
  };
}

export async function openTutorialStarterPackPayload(
  tx: Prisma.TransactionClient,
  actor: TutorialActor,
  tutorialKey: string,
) {
  const { store, user } = await getOrCreateTutorialUser(tx, actor);

  const base = await upsertTutorialProgress(tx, {
    userId: user.id,
    tutorialKey,
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

  const clientRequestId = progress.starterPackClientRequestId ?? randomUUID();
  const progressWithRequestId = progress.starterPackClientRequestId
    ? progress
    : await (tx as any).tutorialProgress.update({
        where: { id: progress.id },
        data: { starterPackClientRequestId: clientRequestId },
      });

  // Idempotency: PackOpen is keyed by (user_id, client_request_id).
  const existing = await tx.packOpen.findUnique({
    where: {
      userId_clientRequestId: {
        userId: user.id,
        clientRequestId,
      },
    },
    select: { id: true, pityCounterAfter: true },
  });

  if (existing) {
    const pulls = await tx.packOpenPull.findMany({
      where: { packOpenId: existing.id },
    });
    const now = new Date();
    const updatedProgress = progressWithRequestId.starterPackOpenedAt
      ? progressWithRequestId
      : await (tx as any).tutorialProgress.update({
          where: { id: progressWithRequestId.id },
          data: {
            starterPackClientRequestId: clientRequestId,
            starterPackOpenedAt: now,
            currentStep: actor.isGuest ? "ACCOUNT_PROMPT" : "COMPLETE_REDIRECT",
            accountPromptShownAt:
              actor.isGuest && !progressWithRequestId.accountPromptShownAt
                ? now
                : progressWithRequestId.accountPromptShownAt,
          },
        });

    return {
      user_id: user.id,
      is_guest: actor.isGuest,
      ...computeTutorialStateForResponse(updatedProgress, actor.isGuest),
      opened: true,
      results: buildOpenResultReplay(pulls, existing.pityCounterAfter ?? 0),
    };
  }

  const seed = `${user.id}-${Date.now()}-${process.env.GLOBAL_SEED_SALT ?? "kanohi-server-salt"}-tutorial`;

  let packOpenRow;
  try {
    packOpenRow = await tx.packOpen.create({
      data: {
        userId: user.id,
        packId: TUTORIAL_STARTER_PACK_ID,
        clientRequestId,
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
          clientRequestId,
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
      ...computeTutorialStateForResponse(progressWithRequestId, actor.isGuest),
      opened: true,
      results: buildOpenResultReplay(pulls, raced.pityCounterAfter ?? 0),
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
      starterPackClientRequestId: clientRequestId,
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
}
