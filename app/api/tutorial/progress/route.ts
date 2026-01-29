import { z } from "zod";
import { getRequestId, jsonError, jsonOk, startRouteSpan } from "@/lib/api/routeUtils";
import { getOrCreateUserId, setGuestCookie } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { TUTORIAL_KEY } from "@/lib/tutorial/constants";
import { tutorialKeySchema } from "@/lib/tutorial/server";
import { getTutorialProgressPayload } from "@/lib/tutorial/service";
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
      return getTutorialProgressPayload(tx, actor, tutorialKey);
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
