import { getRequestId, jsonError, jsonOk, startRouteSpan } from "../../../../lib/api/routeUtils";
import { getUserId } from "../../../../lib/auth";
import { packStatus } from "../../../../lib/engine";

export async function GET(req: Request) {
  const requestId = getRequestId(req);
  const span = startRouteSpan("GET /api/packs/status", requestId);
  try {
    const { userId, isGuest } = await getUserId();
    if (!userId) {
      span.ok({ status: 400, reason: "missing_user" });
      return jsonError("No userId found in pack status", 400, requestId);
    }
    const status = await packStatus(isGuest, userId, "free_daily_v1");
    span.ok({ status: 200, isGuest });
    return jsonOk(status, requestId);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    span.error(err, { status: 400 });
    return jsonError(message, 400, requestId);
  }
}
