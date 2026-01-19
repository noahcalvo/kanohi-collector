import { getAuth } from "@clerk/nextjs/server";
import { parse } from "cookie";
import { NextApiRequest, NextApiResponse } from "next";
import { GUEST_COOKIE } from "../../lib/auth";
import { prisma } from "@/lib/db/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  // Read guest user id from cookie
  const cookies = req.headers.cookie ? parse(req.headers.cookie) : {};
  const guestUserId = cookies[GUEST_COOKIE];
  if (!guestUserId) {
    return res.status(400).json({ error: "No guest user cookie found" });
  }

  // Update the guest user row with the new Clerk ID
  try {
    await prisma.user.update({
      where: { id: guestUserId },
      data: { clerkId },
    });
    // Optionally, clear the guest cookie here
    res.setHeader(
      "Set-Cookie",
      `${GUEST_COOKIE}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
    );
    // Redirect to home or profile page
    res.redirect("/collection");
  } catch (error) {
    res.status(500).json({ error: "Failed to update user" });
  }
}
