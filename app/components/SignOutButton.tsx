"use client";
import { SignOutButton as ClerkSignOutButton } from "@clerk/nextjs";

export function SignOutButton() {
  return (
    <ClerkSignOutButton>
      <button className="button-secondary">Sign Out</button>
    </ClerkSignOutButton>
  );
}
