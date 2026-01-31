import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { getRequestId, jsonError, jsonOk, startRouteSpan } from "../../../../../lib/api/routeUtils";
import { getUserId } from "../../../../../lib/auth";
import { prisma } from "../../../../../lib/db/prisma";
import { equipMask } from "../../../../../lib/engine";
import { createPrismaStore } from "../../../../../lib/store/prismaStore";

const schema = z.object({
  slot: z.enum(["TOA", "TURAGA", "NONE"]),
  confirm_pack_trim: z.boolean().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: { mask_id: string } }
) {
  const requestId = getRequestId(request);
  const span = startRouteSpan("POST /api/mask/[mask_id]/equip", requestId);
  try {
    const body = await request.json();
    const parsed = schema.parse(body);
    const { userId, isGuest } = await getUserId();
    if (!userId) {
      span.ok({ status: 400, reason: "missing_user" });
      return jsonError("No userId found in equip mask", 400, requestId);
    }
    const updated = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const store = createPrismaStore(tx);
      return equipMask(isGuest, userId, params.mask_id, parsed.slot, store, {
        confirm_pack_trim: parsed.confirm_pack_trim,
      });
    });
    span.ok({ status: 200, isGuest });
    return jsonOk({
      mask_id: updated.mask_id,
      slot: updated.equipped_slot,
    }, requestId);
  } catch (err) {
    const statusCode =
      typeof err === "object" && err && "statusCode" in err
        ? Number((err as any).statusCode)
        : 400;
    const extra =
      typeof err === "object" && err && "extra" in err
        ? ((err as any).extra as Record<string, unknown>)
        : undefined;
    const message = err instanceof Error ? err.message : "Unknown error";
    span.error(err, { status: statusCode });
    return jsonError(message, statusCode, requestId, extra);
  }
}
