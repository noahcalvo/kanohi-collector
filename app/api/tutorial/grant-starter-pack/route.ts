import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
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

      // Idempotency / review mode: never re-grant.
      if (locked.completedAt || locked.starterPackGrantedAt) {
        return {
          user_id: user.id,
          is_guest: actor.isGuest,
          ...computeTutorialStateForResponse(locked, actor.isGuest),
          next_step: computeTutorialStateForResponse(locked, actor.isGuest)
            .effective_step,
        };
      }

      const now = new Date();
      const clientRequestId = randomUUID();
      const nextStep = "OPEN_STARTER_PACK";

      const updated = await (tx as any).tutorialProgress.update({
        where: { id: locked.id },
        data: {
          starterPackGrantedAt: now,
          starterPackClientRequestId: clientRequestId,
          currentStep: nextStep,
        },
      });

      return {
        user_id: user.id,
        is_guest: actor.isGuest,
        ...computeTutorialStateForResponse(updated, actor.isGuest),
        next_step: nextStep,
      };
    });

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
