import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { GUEST_COOKIE } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: Request) {
	console.log("Upgrade guest route called");
	// Get Clerk user ID
	const { userId: clerkId } = await auth();
	if (!clerkId) {
		return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
	}

	// Get guest user ID from cookie
	const guestUserId = cookies().get(GUEST_COOKIE)?.value;
	if (!guestUserId) {
		return NextResponse.json({ error: "No guest user cookie found" }, { status: 400 });
	}

	// Update the guest user row with the new Clerk ID and set created_from_guest = false
	try {
		let resp = await prisma.user.update({
			where: { id: guestUserId },
			data: {
				clerkId,
			},
		});
		console.log("Guest user upgraded:", resp);
		// Clear the guest cookie
		cookies().set(GUEST_COOKIE, "", { path: "/", expires: new Date(0) });
		// Redirect home (absolute URL required)
		// Use the request URL as base
		// @ts-ignore: 'request' is available in API route context
		return NextResponse.redirect(new URL("/", request.url));
	} catch (err) {
		console.log("Error upgrading guest user:", err);
		return NextResponse.json({ error: "Failed to upgrade guest user", details: err }, { status: 500 });
	}
}
