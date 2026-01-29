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
import { computeNextStep } from "@/lib/tutorial/stepEngine";

const bodySchema = z.object({
  tutorialKey: tutorialKeySchema.optional().default(TUTORIAL_KEY),
});

export async function POST(req: Request) {
  const requestId = getRequestId(req);
  const span = startRouteSpan("POST /api/tutorial/advance", requestId);
  try {
    const body = bodySchema.parse(await req.json().catch(() => ({})));

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

      // Review mode: if the user is viewing the mask selection step, advance should
      // always land on the starter pack step (even though nothing is granted).
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
