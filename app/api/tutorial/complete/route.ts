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

const bodySchema = z.object({
  tutorialKey: tutorialKeySchema.optional().default(TUTORIAL_KEY),
});

export async function POST(req: Request) {
  const requestId = getRequestId(req);
  const span = startRouteSpan("POST /api/tutorial/complete", requestId);
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

      const firstTimeCompleted = locked.completedAt === null;

      const now = new Date();
      const updated = await (tx as any).tutorialProgress.update({
        where: { id: locked.id },
        data: {
          completedAt: locked.completedAt ?? now,
          // Reset to intro so revisiting /tutorial becomes a non-granting review run.
          currentStep: "INTRO_BIONICLE",
        },
      });

      return {
        user_id: user.id,
        is_guest: actor.isGuest,
        first_time_completed: firstTimeCompleted,
        ...computeTutorialStateForResponse(updated, actor.isGuest),
      };
    });

    span.ok({ status: 200, isGuest: actor.isGuest, firstTimeCompleted: result.first_time_completed });
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
