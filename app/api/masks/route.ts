import { getRequestId, jsonError, jsonOk, startRouteSpan } from "@/lib/api/routeUtils";
import { masks } from "@/lib/staticData";

export async function GET(req: Request) {
  const requestId = getRequestId(req);
  const span = startRouteSpan("GET /api/masks", requestId);
  try {
    span.ok({ status: 200 });
    return jsonOk({ masks }, requestId);
  } catch (err) {
    span.error(err, { status: 500 });
    return jsonError("Internal server error", 500, requestId);
  }
}
