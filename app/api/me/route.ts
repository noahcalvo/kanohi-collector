import { getRequestId, jsonError, jsonOk, startRouteSpan } from "../../../lib/api/routeUtils";
import { getUserId, setGuestCookie } from "../../../lib/auth";
import { mePayload } from "../../../lib/engine";

const GET = async (req: Request) => {
  const requestId = getRequestId(req);
  const span = startRouteSpan("GET /api/me", requestId);
  try {
    const { userId, isGuest } = await getUserId();
    if (!userId) {
      span.ok({ status: 400, reason: "missing_user" });
      return jsonError("No userId found in GET /api/me", 400, requestId);
    }
    const payload = await mePayload(isGuest, userId);
    span.ok({ status: 200, isGuest });
    return jsonOk(payload, requestId);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    span.error(err, { status: 400 });
    return jsonError(message, 400, requestId);
  }
};

const POST = async (req: Request) => {
  const requestId = getRequestId(req);
  const span = startRouteSpan("POST /api/me", requestId);
  // Only create a guest user if explicitly requested
  const url = new URL(req.url);
  const guest = url.searchParams.get("guest");
  if (!guest) {
    span.ok({ status: 400, reason: "guest_not_requested" });
    return jsonError("Guest creation not requested", 400, requestId);
  }
  try {
    // Always create a new guest user and set cookie
    const { createNewGuestId } = await import("../../../lib/guestUser");
    const { prismaStore } = await import("../../../lib/store/prismaStore");
    const userId = createNewGuestId();
    await prismaStore.getOrCreateUser(true, userId);
    setGuestCookie(userId);
    const payload = await mePayload(true, userId);
    span.ok({ status: 200, isGuest: true });
    return jsonOk(payload, requestId);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    span.error(err, { status: 400 });
    return jsonError(message, 400, requestId);
  }
};

export { GET, POST };