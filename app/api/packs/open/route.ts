import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { getRequestId, jsonError, jsonOk, startRouteSpan } from "../../../../lib/api/routeUtils";
import { getUserId } from "../../../../lib/auth";
import { prisma } from "../../../../lib/db/prisma";
import { openPackPayload } from "../../../../lib/packs/service";

const schema = z.object({
  pack_id: z.string(),
  client_request_id: z.string().uuid(),
});

const PACK_ID = "free_daily_v1";

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const span = startRouteSpan("POST /api/packs/open", requestId);
  try {
    const body = await request.json();
    const parsed = schema.parse(body);
    const { userId, isGuest } = await getUserId();
    if (!userId) {
      span.ok({ status: 401, reason: "unauthorized" });
      return jsonError("Unauthorized", 401, requestId);
    }
    if (parsed.pack_id !== PACK_ID) {
      span.ok({ status: 400, reason: "unknown_pack" });
      return jsonError("Unknown pack", 400, requestId);
    }

    // We model pack opens as a domain event in Postgres and use
    // (user_id, client_request_id) as the idempotency key.

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      return openPackPayload(
        tx,
        { isGuest, userId },
        {
          packId: parsed.pack_id,
          clientRequestId: parsed.client_request_id,
          requestId,
        },
      );
    });

    span.ok({ status: 200, isGuest });
    return jsonOk(result, requestId);
  } catch (err) {
    const statusCode =
      typeof err === "object" && err && "statusCode" in err
        ? Number((err as any).statusCode)
        : 400;
    const message = err instanceof Error ? err.message : "Unknown error";
    span.error(err, { status: statusCode });
    return jsonError(message, statusCode, requestId);
  }
}
