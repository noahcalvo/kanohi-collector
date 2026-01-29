import { z } from "zod";
import { getRequestId, jsonError, jsonOk, startRouteSpan } from "../../../../../lib/api/routeUtils";
import { getUserId } from "../../../../../lib/auth";
import { equipMask } from "../../../../../lib/engine";

const schema = z.object({ slot: z.enum(["TOA", "TURAGA", "NONE"]) });

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
    const updated = await equipMask(
      isGuest,
      userId,
      params.mask_id,
      parsed.slot,
    );
    span.ok({ status: 200, isGuest });
    return jsonOk({
      mask_id: updated.mask_id,
      slot: updated.equipped_slot,
    }, requestId);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    span.error(err, { status: 400 });
    return jsonError(message, 400, requestId);
  }
}
