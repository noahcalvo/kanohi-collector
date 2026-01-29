import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getRequestId, jsonError, startRouteSpan } from "@/lib/api/routeUtils";
import { GUEST_COOKIE } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: Request) {
	const requestId = getRequestId(request);
	const span = startRouteSpan("GET /api/upgrade-guest", requestId);

	// Get Clerk user ID
	const { userId: clerkId } = await auth();
	if (!clerkId) {
		span.ok({ status: 401, reason: "not_authenticated" });
		return jsonError("Not authenticated", 401, requestId);
	}

	// Get guest user ID from cookie
	const guestUserId = cookies().get(GUEST_COOKIE)?.value;
	if (!guestUserId) {
		span.ok({ status: 400, reason: "missing_guest_cookie" });
		return jsonError("No guest user cookie found", 400, requestId);
	}

	// Update the guest user row with the new Clerk ID and set created_from_guest = false
	try {
		await prisma.user.update({
			where: { id: guestUserId },
			data: {
				clerkId,
			},
		});
		// Clear the guest cookie
		cookies().set(GUEST_COOKIE, "", { path: "/", expires: new Date(0) });
		// Redirect home (absolute URL required)
		// Use the request URL as base
		const res = NextResponse.redirect(new URL("/", request.url));
		res.headers.set("x-request-id", requestId);
		span.ok({ status: 302, upgraded: true });
		return res;
	} catch (err) {
		span.error(err, { status: 500 });
		return jsonError("Failed to upgrade guest user", 500, requestId);
	}
}
