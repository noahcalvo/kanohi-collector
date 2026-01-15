import { randomUUID } from "crypto";
import type { GameStore } from "./gameStore";
import type { EventRow, User, UserMask, UserPackProgress } from "../types";
import { PACK_UNITS_PER_PACK } from "../constants";

export function createMemoryStore(opts?: {
  seedUserId?: string;
  seedPackId?: string;
}): GameStore {
  const userId = opts?.seedUserId ?? "user-1";
  const packId = opts?.seedPackId ?? "free_daily_v1";

  let users: User[] = [
    {
      id: userId,
      username: "Test User",
      created_at: new Date(),
      last_active_at: new Date(),
      settings: {},
      created_from_guest: true,
    },
  ];

  let userMasks: UserMask[] = [
    {
      id: randomUUID(),
      user_id: userId,
      mask_id: "1",
      owned_count: 1,
      essence: 0,
      level: 1,
      equipped_slot: "TOA",
      unlocked_colors: ["red"],
      equipped_color: "red",
      last_acquired_at: new Date(),
    },
  ];

  let userPackProgress: UserPackProgress[] = [
    {
      user_id: userId,
      pack_id: packId,
      fractional_units: PACK_UNITS_PER_PACK,
      last_unit_ts: new Date(),
      pity_counter: 0,
      last_pack_claim_ts: null,
    },
  ];

  const events: EventRow[] = [];

  return {
    async getOrCreateUser(uid: string) {
      const existing = users.find((u) => u.id === uid);
      if (existing) return existing;
      const created: User = {
        id: uid,
        username: uid,
        created_at: new Date(),
        last_active_at: new Date(),
        settings: {},
        created_from_guest: false,
      };
      users.push(created);
      userPackProgress.push({
        user_id: uid,
        pack_id: packId,
        fractional_units: PACK_UNITS_PER_PACK,
        last_unit_ts: new Date(),
        pity_counter: 0,
        last_pack_claim_ts: null,
      });
      return created;
    },

    async getUserMask(uid, maskId) {
      return userMasks.find((m) => m.user_id === uid && m.mask_id === maskId);
    },

    async getUserMasks(uid) {
      return userMasks.filter((m) => m.user_id === uid);
    },

    async upsertUserMask(entry) {
      const idx = userMasks.findIndex(
        (m) => m.user_id === entry.user_id && m.mask_id === entry.mask_id
      );
      if (idx >= 0) {
        userMasks[idx] = { ...entry, id: userMasks[idx].id };
      } else {
        userMasks.push(entry);
      }
    },

    async getUserPackProgress(uid, pid) {
      return userPackProgress.find(
        (p) => p.user_id === uid && p.pack_id === pid
      );
    },

    async upsertUserPackProgress(progress) {
      const idx = userPackProgress.findIndex(
        (p) => p.user_id === progress.user_id && p.pack_id === progress.pack_id
      );
      if (idx >= 0) userPackProgress[idx] = progress;
      else userPackProgress.push(progress);
    },

    async appendEvent(evt) {
      events.push(evt);
    },
  };
}
