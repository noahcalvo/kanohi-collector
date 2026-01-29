import { randomUUID } from "crypto";
import { PACK_UNITS_PER_PACK } from "../constants";
import { prisma } from "../db/prisma";
import type { EventRow, User, UserMask, UserPackProgress } from "../types";
import type { GameStore } from "./gameStore";

type PrismaLike = typeof prisma;
type PrismaTx = Parameters<PrismaLike["$transaction"]>[0] extends (
  tx: infer T,
  ...args: any
) => any
  ? T
  : never;

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

export function createPrismaStore(
  client: PrismaLike | PrismaTx = prisma,
): GameStore {
  return {
  async getOrCreateUser(kanohiId: boolean, id: string): Promise<User> {
    let user;
    if (kanohiId) {
      user = await client.user.upsert({
        where: { id: id },
        create: { id: id },
        update: {},
      });
    } else {
      user = await client.user.findFirst({ where: { clerkId: id } });
      if (!user) {
        // First-time registered user: create an internal user id and bind it to Clerk.
        user = await client.user.create({
          data: {
            id: randomUUID(),
            clerkId: id,
          },
        });
      }
    }
    console.log(
      `[prismaStore] getOrCreateUser: kanohiId=${kanohiId} userId=${id} -> id=${user.id}`,
    );

    // Ensure the default pack progress exists so new users can play immediately.
    // NOTE: Prisma `upsert` can still surface unique-constraint races under
    // concurrent first-load requests (e.g. account upgrade + page data fetch).
    // `createMany(..., skipDuplicates: true)` is safe and we don't need to update.
    await client.userPackProgress.createMany({
      data: [
        {
          userId: user.id,
          packId: "free_daily_v1",
          fractionalUnits: PACK_UNITS_PER_PACK,
          pityCounter: 0,
          lastUnitTs: new Date(),
          lastPackClaimTs: null,
        },
      ],
      skipDuplicates: true,
    });

    return toUser(user);
  },

  async getUserMask(
    userId: string,
    maskId: string,
  ): Promise<UserMask | undefined> {
    const row = await client.userMask.findUnique({
      where: { userId_maskId: { userId, maskId } },
    });
    return row ? toUserMask(row) : undefined;
  },

  async getUserMasks(userId: string): Promise<UserMask[]> {
    const rows = await client.userMask.findMany({ where: { userId } });
    return rows.map(toUserMask);
  },

  async upsertUserMask(entry: UserMask): Promise<void> {
    await client.userMask.upsert({
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
    const row = await client.userPackProgress.findUnique({
      where: { userId_packId: { userId, packId } },
    });
    return row ? toUserPackProgress(row) : undefined;
  },

  async lockUserPackProgress(
    userId: string,
    packId: string,
  ): Promise<UserPackProgress | undefined> {
    // Prisma doesn't expose row locking in the query builder; use a raw query.
    // This must run inside a transaction to have any effect.
    const rows = await (client as any).$queryRaw<
      Array<{
        userId: string;
        packId: string;
        fractionalUnits: number;
        lastUnitTs: Date;
        pityCounter: number;
        lastPackClaimTs: Date | null;
      }>
    >`
      SELECT "userId", "packId", "fractionalUnits", "lastUnitTs", "pityCounter", "lastPackClaimTs"
      FROM "UserPackProgress"
      WHERE "userId" = ${userId} AND "packId" = ${packId}
      FOR UPDATE
    `;
    const row = rows?.[0];
    return row
      ? {
          user_id: row.userId,
          pack_id: row.packId,
          fractional_units: row.fractionalUnits,
          last_unit_ts: row.lastUnitTs,
          pity_counter: row.pityCounter,
          last_pack_claim_ts: row.lastPackClaimTs,
        }
      : undefined;
  },

  async upsertUserPackProgress(progress: UserPackProgress): Promise<void> {
    await client.userPackProgress.upsert({
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
    await client.eventRow.create({
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
}

export const prismaStore: GameStore = createPrismaStore(prisma);
