import { z } from "zod";
import { getRequestId, jsonError, jsonOk, startRouteSpan } from "@/lib/api/routeUtils";
import { getOrCreateUserId, setGuestCookie } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { createPrismaStore } from "@/lib/store/prismaStore";
import { TUTORIAL_KEY } from "@/lib/tutorial/constants";
import {
  computeTutorialStateForResponse,
  tutorialKeySchema,
  upsertTutorialProgress,
} from "@/lib/tutorial/server";
import { STARTER_MASK_IDS } from "@/lib/tutorial/starterMasks";

export async function GET(req: Request) {
  const requestId = getRequestId(req);
  const span = startRouteSpan("GET /api/tutorial/progress", requestId);
  try {
    const url = new URL(req.url);
    const tutorialKey = tutorialKeySchema.parse(
      url.searchParams.get("tutorialKey") ?? TUTORIAL_KEY,
    );

    const actor = await getOrCreateUserId();
    if (actor.setCookie) setGuestCookie(actor.userId);

    const result = await prisma.$transaction(async (tx) => {
      const store = createPrismaStore(tx);
      const user = await store.getOrCreateUser(actor.isGuest, actor.userId);
      const progress = await upsertTutorialProgress(tx, {
        userId: user.id,
        tutorialKey,
      });

      return {
        user_id: user.id,
        is_guest: actor.isGuest,
        ...computeTutorialStateForResponse(progress, actor.isGuest),
      };
    });

    span.ok({ status: 200, isGuest: actor.isGuest });
    return jsonOk(
      {
        ...result,
        starter_mask_ids: STARTER_MASK_IDS,
      },
      requestId,
    );
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
