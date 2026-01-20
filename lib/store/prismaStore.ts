import { randomUUID } from "crypto";
import { PACK_UNITS_PER_PACK } from "../constants";
import { prisma } from "../db/prisma";
import type { EventRow, User, UserMask, UserPackProgress } from "../types";
import type { GameStore } from "./gameStore";

function toUser(u: {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  clerkId?: string | null;
}): User {
  return {
    id: u.id,
    username: u.id,
    created_at: u.createdAt,
    last_active_at: u.updatedAt,
    settings: {},
    created_from_guest: false,
    clerk_id: u.clerkId ?? null,
  };
}

function toUserMask(row: any): UserMask {
  return {
    id: row.id,
    user_id: row.userId,
    mask_id: row.maskId,
    owned_count: row.ownedCount,
    essence: row.essence,
    level: row.level,
    equipped_slot: row.equippedSlot,
    unlocked_colors: row.unlockedColors ?? [],
    equipped_color: row.equippedColor,
    last_acquired_at: row.lastAcquiredAt,
  };
}

function toUserPackProgress(row: any): UserPackProgress {
  return {
    user_id: row.userId,
    pack_id: row.packId,
    fractional_units: row.fractionalUnits,
    last_unit_ts: row.lastUnitTs,
    pity_counter: row.pityCounter,
    last_pack_claim_ts: row.lastPackClaimTs,
  };
}

export const prismaStore: GameStore = {
  async getOrCreateUser(kanohiId: boolean, id: string): Promise<User> {
    let user;
    if (kanohiId) {
      user = await prisma.user.upsert({
        where: { id: id },
        create: { id: id },
        update: {},
      });
    } else {
      user = await prisma.user.findFirst({
        where: { clerkId: id },
      });
    }
    if (!user) {
      throw new Error("Non-kanohi user not found with id " + id);
    }
    console.log(
      `[prismaStore] getOrCreateUser: kanohiId=${kanohiId} userId=${id} -> id=${user.id}`,
    );

    // Ensure the default pack progress exists so new users can play immediately.
    await prisma.userPackProgress.upsert({
      where: { userId_packId: { userId: user.id, packId: "free_daily_v1" } },
      create: {
        userId: user.id,
        packId: "free_daily_v1",
        fractionalUnits: PACK_UNITS_PER_PACK,
        pityCounter: 0,
        lastUnitTs: new Date(),
        lastPackClaimTs: null,
      },
      update: {},
    });

    return toUser(user);
  },

  async getUserMask(
    userId: string,
    maskId: string,
  ): Promise<UserMask | undefined> {
    const row = await prisma.userMask.findUnique({
      where: { userId_maskId: { userId, maskId } },
    });
    return row ? toUserMask(row) : undefined;
  },

  async getUserMasks(userId: string): Promise<UserMask[]> {
    const rows = await prisma.userMask.findMany({ where: { userId } });
    return rows.map(toUserMask);
  },

  async upsertUserMask(entry: UserMask): Promise<void> {
    await prisma.userMask.upsert({
      where: {
        userId_maskId: { userId: entry.user_id, maskId: entry.mask_id },
      },
      create: {
        id: entry.id || undefined,
        userId: entry.user_id,
        maskId: entry.mask_id,
        ownedCount: entry.owned_count,
        essence: entry.essence,
        level: entry.level,
        equippedSlot: entry.equipped_slot,
        unlockedColors: entry.unlocked_colors,
        equippedColor: entry.equipped_color,
        lastAcquiredAt: entry.last_acquired_at,
      },
      update: {
        ownedCount: entry.owned_count,
        essence: entry.essence,
        level: entry.level,
        equippedSlot: entry.equipped_slot,
        unlockedColors: entry.unlocked_colors,
        equippedColor: entry.equipped_color,
        lastAcquiredAt: entry.last_acquired_at,
      },
    });
  },

  async getUserPackProgress(
    userId: string,
    packId: string,
  ): Promise<UserPackProgress | undefined> {
    const row = await prisma.userPackProgress.findUnique({
      where: { userId_packId: { userId, packId } },
    });
    return row ? toUserPackProgress(row) : undefined;
  },

  async upsertUserPackProgress(progress: UserPackProgress): Promise<void> {
    await prisma.userPackProgress.upsert({
      where: {
        userId_packId: { userId: progress.user_id, packId: progress.pack_id },
      },
      create: {
        userId: progress.user_id,
        packId: progress.pack_id,
        fractionalUnits: progress.fractional_units,
        lastUnitTs: progress.last_unit_ts,
        pityCounter: progress.pity_counter,
        lastPackClaimTs: progress.last_pack_claim_ts,
      },
      update: {
        fractionalUnits: progress.fractional_units,
        lastUnitTs: progress.last_unit_ts,
        pityCounter: progress.pity_counter,
        lastPackClaimTs: progress.last_pack_claim_ts,
      },
    });
  },

  async appendEvent(evt: EventRow): Promise<void> {
    await prisma.eventRow.create({
      data: {
        eventId: evt.event_id || randomUUID(),
        userId: evt.user_id ?? "none",
        type: evt.type,
        payload: evt.payload as any,
        timestamp: evt.timestamp,
      },
    });
  },
};
