import { randomUUID } from "crypto";
import type { User } from "./types";

/**
 * Create a new guest user object with a random id and clerkId as null.
 * This does not persist to the database, just returns the object.
 */
export function createGuestUser(): User & { clerkId?: string | null } {
  const id = `${randomUUID()}`;
  return {
    id,
    username: id,
    created_at: new Date(),
    last_active_at: new Date(),
    settings: {},
    created_from_guest: true,
  };
}

export function createNewGuestId(): string {
    return `${randomUUID()}`;
}