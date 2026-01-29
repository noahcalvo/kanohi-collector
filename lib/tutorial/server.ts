import type { Prisma } from "@prisma/client";
import { z } from "zod";
import type { TutorialStep as TutorialStepLiteral } from "./constants";
import { computeEffectiveTutorialState } from "./stepEngine";

type TutorialProgressRow = {
  id: string;
  userId: string;
  tutorialKey: string;
  currentStep: string;

  completedAt: Date | null;

  rareMaskGrantedAt: Date | null;
  rareMaskMaskId: string | null;

  starterPackClientRequestId: string | null;
  starterPackOpenedAt: Date | null;

  accountPromptShownAt: Date | null;
};

export const tutorialKeySchema = z.string().min(1);

export function toLiteralStep(step: string): TutorialStepLiteral {
  return step as unknown as TutorialStepLiteral;
}

export function toProgressLike(row: TutorialProgressRow) {
  return {
    currentStep: toLiteralStep(row.currentStep),
    completedAt: row.completedAt,
    rareMaskGrantedAt: row.rareMaskGrantedAt,
    starterPackOpenedAt: row.starterPackOpenedAt,
    accountPromptShownAt: row.accountPromptShownAt,
  };
}

export async function upsertTutorialProgress(
  tx: Prisma.TransactionClient,
  args: {
    userId: string;
    tutorialKey: string;
  },
): Promise<TutorialProgressRow> {
  return (tx as any).tutorialProgress.upsert({
    where: {
      tutorialKey_userId: {
        tutorialKey: args.tutorialKey,
        userId: args.userId,
      },
    },
    create: {
      userId: args.userId,
      tutorialKey: args.tutorialKey,
      currentStep: "INTRO_BIONICLE",
    },
    update: {},
  });
}

export async function lockTutorialProgress(
  tx: Prisma.TransactionClient,
  id: string,
): Promise<void> {
  // Prisma doesn't expose row locking; use raw SQL. Must be inside the caller transaction.
  await tx.$queryRaw`
    SELECT "id" FROM "TutorialProgress" WHERE "id" = ${id} FOR UPDATE
  `;
}

export function computeTutorialStateForResponse(
  row: TutorialProgressRow,
  isGuest: boolean,
) {
  const progressLike = toProgressLike(row);
  const effective = computeEffectiveTutorialState(progressLike, isGuest);
  return {
    tutorial_key: row.tutorialKey,
    current_step: progressLike.currentStep,
    effective_step: effective.effectiveStep,
    review_mode: effective.reviewMode,

    completed_at: row.completedAt,
    rare_mask_granted_at: row.rareMaskGrantedAt,
    rare_mask_mask_id: row.rareMaskMaskId,
    starter_pack_opened_at: row.starterPackOpenedAt,
    starter_pack_client_request_id: row.starterPackClientRequestId,
    account_prompt_shown_at: row.accountPromptShownAt,
  };
}
