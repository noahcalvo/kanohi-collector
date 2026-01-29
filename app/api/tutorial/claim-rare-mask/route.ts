import { z } from "zod";
import { getRequestId, jsonError, jsonOk, startRouteSpan } from "@/lib/api/routeUtils";
import { getOrCreateUserId, setGuestCookie } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { TUTORIAL_KEY } from "@/lib/tutorial/constants";
import { tutorialKeySchema } from "@/lib/tutorial/server";
import { claimRareMaskPayload } from "@/lib/tutorial/service";

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
      return claimRareMaskPayload(
        tx,
        actor,
        body.tutorialKey,
        body.selection.maskId,
      );
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
