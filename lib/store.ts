import { randomUUID } from "crypto";
import { PACK_UNITS_PER_PACK, PACK_UNIT_SECONDS } from "./constants";
import type {
  EventRow,
  Friend,
  Mask,
  Pack,
  User,
  UserMask,
  UserPackProgress,
} from "./types";

const now = () => new Date();

const masksSeed: Mask[] = [
  // {
  //   mask_id: "gen1_toa_01",
  //   generation: 1,
  //   name: "Kanohi Hau",
  //   base_rarity: "RARE",
  //   base_color_distribution: { standard: 80, alt_blue: 10, alt_black: 10 },
  //   base_image_ids: { standard: "hau_std", alt_blue: "hau_blue", alt_black: "hau_black" },
  //   buff_type: "PACK_LUCK",
  //   buff_base_value: 0.0025,
  //   max_level: 5,
  //   description: "Defensive mask with pack luck",
  // },
  // {
  //   mask_id: "gen1_toa_02",
  //   generation: 1,
  //   name: "Kanohi Kakama",
  //   base_rarity: "COMMON",
  //   base_color_distribution: { standard: 80, alt_green: 20 },
  //   base_image_ids: { standard: "kakama_std", alt_green: "kakama_green" },
  //   buff_type: "TIMER_SPEED",
  //   buff_base_value: 0.01,
  //   max_level: 10,
  //   description: "Speed mask boosts timers",
  // },
  {
    mask_id: "1",
    generation: 1,
    name: "Noble Ruru",
    base_rarity: "COMMON",
    base_color_distribution: {
      standard: 10,
      alt_copper: 10,
      blue: 30,
      red: 30,
      green: 20,
    },
    base_image_ids: {
      standard: "ruru_std",
      alt_copper: "ruru_copper",
      blue: "ruru_blue",
      red: "ruru_red",
      green: "ruru_green",
    },
    buff_type: "DISCOVERY",
    buff_base_value: 0.05,
    max_level: 10,
    description: "Helps discover new masks",
  },
  {
    mask_id: "gen1_mythic_01",
    generation: 1,
    name: "Mask of Time",
    base_rarity: "MYTHIC",
    base_color_distribution: { standard: 100 },
    base_image_ids: { standard: "time_std" },
    buff_type: "PACK_LUCK",
    buff_base_value: 0.01,
    max_level: 3,
    description: "Legendary mask increasing pack luck",
    is_unique_mythic: true,
  },
];

const packsSeed: Pack[] = [
  {
    pack_id: "free_daily_v1",
    name: "Daily Pack",
    masks_per_pack: 2,
    guaranteed_min_rarity_floor: "COMMON",
    featured_generation: 1,
    created_at: now(),
  },
];

const usersSeed: User[] = [
  {
    id: "user-1",
    username: "Toa Noah",
    created_at: now(),
    last_active_at: now(),
    settings: {},
    created_from_guest: true,
  },
];

const userMasksSeed: UserMask[] = [
  {
    id: randomUUID(),
    user_id: "user-1",
    mask_id: "1",
    owned_count: 1,
    essence: 0,
    level: 1,
    equipped_slot: "TOA",
    unlocked_colors: ["red"],
    last_acquired_at: now(),
  },
];

const userPackProgressSeed: UserPackProgress[] = [
  {
    user_id: "user-1",
    pack_id: "free_daily_v1",
    fractional_units: PACK_UNITS_PER_PACK,
    last_unit_ts: now(),
    pity_counter: 0,
    last_pack_claim_ts: null,
  },
];

const friendsSeed: Friend[] = [];
const eventsSeed: EventRow[] = [];
function clone<T>(val: T): T {
  if (typeof structuredClone === "function") return structuredClone(val);
  return JSON.parse(JSON.stringify(val));
}

let masks: Mask[] = clone(masksSeed);
let packs: Pack[] = clone(packsSeed);
let users: User[] = clone(usersSeed);
let userMasks: UserMask[] = clone(userMasksSeed);
let userPackProgress: UserPackProgress[] = clone(userPackProgressSeed);
let friends: Friend[] = clone(friendsSeed);
let events: EventRow[] = clone(eventsSeed);

export const db = {
  get masks() {
    return masks;
  },
  get packs() {
    return packs;
  },
  get users() {
    return users;
  },
  get userMasks() {
    return userMasks;
  },
  get userPackProgress() {
    return userPackProgress;
  },
  get friends() {
    return friends;
  },
  get events() {
    return events;
  },
};

export function resetStore(): void {
  masks = clone(masksSeed);
  packs = clone(packsSeed);
  users = clone(usersSeed);
  userMasks = clone(userMasksSeed);
  userPackProgress = clone(userPackProgressSeed);
  friends = clone(friendsSeed);
  events = clone(eventsSeed);
}

export function getUser(userId: string): User | undefined {
  return users.find((u) => u.id === userId);
}

export function getUserMask(userId: string, maskId: string): UserMask | undefined {
  return userMasks.find((m) => m.user_id === userId && m.mask_id === maskId);
}

export function upsertUserMask(entry: UserMask): void {
  const existingIdx = userMasks.findIndex((m) => m.id === entry.id);
  if (existingIdx >= 0) {
    userMasks[existingIdx] = entry;
  } else {
    userMasks.push(entry);
  }
}

export function getUserMasks(userId: string): UserMask[] {
  return userMasks.filter((m) => m.user_id === userId);
}

export function getPack(packId: string): Pack | undefined {
  return packs.find((p) => p.pack_id === packId);
}

export function getMask(maskId: string): Mask | undefined {
  return masks.find((m) => m.mask_id === maskId);
}

export function getUserPackProgress(userId: string, packId: string): UserPackProgress | undefined {
  return userPackProgress.find((p) => p.user_id === userId && p.pack_id === packId);
}

export function updateUserPackProgress(progress: UserPackProgress): void {
  const idx = userPackProgress.findIndex((p) => p.user_id === progress.user_id && p.pack_id === progress.pack_id);
  if (idx >= 0) {
    userPackProgress[idx] = progress;
  } else {
    userPackProgress.push(progress);
  }
}

export function appendEvent(evt: EventRow): void {
  events.push(evt);
}

export function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

export function refreshFractionalUnits(progress: UserPackProgress, timerSpeedBonus: number): UserPackProgress {
  if (PACK_UNIT_SECONDS <= 0) {
    progress.fractional_units = PACK_UNITS_PER_PACK;
    progress.last_unit_ts = now();
    return progress;
  }

  const current = nowSeconds();
  const last = Math.floor(progress.last_unit_ts.getTime() / 1000);
  const elapsed = Math.max(current - last, 0);
  const speedMultiplier = 1 + timerSpeedBonus;
  const unitsGained = Math.floor((elapsed * speedMultiplier) / PACK_UNIT_SECONDS);
  if (unitsGained > 0) {
    progress.fractional_units = Math.min(progress.fractional_units + unitsGained, PACK_UNITS_PER_PACK);
    const newTimestampSeconds = last + Math.floor(unitsGained * PACK_UNIT_SECONDS / speedMultiplier);
    progress.last_unit_ts = new Date(newTimestampSeconds * 1000);
  }
  return progress;
}
