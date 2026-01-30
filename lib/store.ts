import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import { PACK_UNITS_PER_PACK, PACK_UNIT_SECONDS } from "./constants";
import { masks as maskDefs, packs as packDefs } from "./staticData";
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

// Determine if we're in a server environment
const isServer = typeof window === "undefined";
const STORAGE_FILE = path.join(process.cwd(), ".kanohi_store.json");

// Canonical seed data lives in `lib/staticData.ts`.
const masksSeed: Mask[] = maskDefs;
const packsSeed: Pack[] = packDefs;

const usersSeed: User[] = [
  {
    id: "user-1",
    username: "Toa Noah",
    created_at: now(),
    last_active_at: now(),
    settings: {},
    created_from_guest: true,
    clerk_id: null
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
    equipped_color: "red",
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

// Storage keys for localStorage persistence
const STORAGE_KEYS = {
  USER_MASKS: "kanohi_user_masks",
  USER_PACK_PROGRESS: "kanohi_user_pack_progress",
  EVENTS: "kanohi_events",
};

// Server-side file store helper
function loadFromFile() {
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      const content = fs.readFileSync(STORAGE_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (e) {
    console.error("Failed to load store from file:", e);
  }
  return null;
}

function saveToFile(data: any) {
  try {
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Failed to save store to file:", e);
  }
}

// Load from localStorage (client) or file (server) if available, otherwise use seed data
function loadUserMasks(): UserMask[] {
  let stored: any = null;

  if (typeof window !== "undefined") {
    // Client side
    const item = localStorage.getItem(STORAGE_KEYS.USER_MASKS);
    stored = item ? JSON.parse(item) : null;
  } else {
    // Server side
    const fileData = loadFromFile();
    stored = fileData?.userMasks;
  }

  if (stored) {
    try {
      return stored.map((m: any) => ({
        ...m,
        last_acquired_at: new Date(m.last_acquired_at),
      }));
    } catch (e) {
      console.error("Failed to parse stored user masks:", e);
    }
  }

  return clone(userMasksSeed);
}

function loadUserPackProgress(): UserPackProgress[] {
  let stored: any = null;

  if (typeof window !== "undefined") {
    // Client side
    const item = localStorage.getItem(STORAGE_KEYS.USER_PACK_PROGRESS);
    stored = item ? JSON.parse(item) : null;
  } else {
    // Server side
    const fileData = loadFromFile();
    stored = fileData?.userPackProgress;
  }

  if (stored) {
    try {
      return stored.map((p: any) => ({
        ...p,
        last_unit_ts: new Date(p.last_unit_ts),
        last_pack_claim_ts: p.last_pack_claim_ts
          ? new Date(p.last_pack_claim_ts)
          : null,
      }));
    } catch (e) {
      console.error("Failed to parse stored pack progress:", e);
    }
  }

  return clone(userPackProgressSeed);
}

function loadEvents(): EventRow[] {
  let stored: any = null;

  if (typeof window !== "undefined") {
    // Client side
    const item = localStorage.getItem(STORAGE_KEYS.EVENTS);
    stored = item ? JSON.parse(item) : null;
  } else {
    // Server side
    const fileData = loadFromFile();
    stored = fileData?.events;
  }

  if (stored) {
    try {
      return stored.map((e: any) => ({
        ...e,
        timestamp: new Date(e.timestamp),
      }));
    } catch (e) {
      console.error("Failed to parse stored events:", e);
    }
  }

  return clone(eventsSeed);
}

// Save helpers
function saveUserMasks(): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEYS.USER_MASKS, JSON.stringify(userMasks));
  } else {
    saveToFile({ userMasks, userPackProgress, events });
  }
}

function saveUserPackProgress(): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(
      STORAGE_KEYS.USER_PACK_PROGRESS,
      JSON.stringify(userPackProgress)
    );
  } else {
    saveToFile({ userMasks, userPackProgress, events });
  }
}

function saveEvents(): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
  } else {
    saveToFile({ userMasks, userPackProgress, events });
  }
}

let masks: Mask[] = clone(masksSeed);
let packs: Pack[] = clone(packsSeed);
let users: User[] = clone(usersSeed);
let userMasks: UserMask[] = loadUserMasks();
let userPackProgress: UserPackProgress[] = loadUserPackProgress();
let friends: Friend[] = clone(friendsSeed);
let events: EventRow[] = loadEvents();

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
  // Also clear the server-side storage file
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      fs.unlinkSync(STORAGE_FILE);
    }
  } catch (e) {
    console.error("Failed to clear store file:", e);
  }
  // Clear client-side storage
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEYS.USER_MASKS);
    localStorage.removeItem(STORAGE_KEYS.USER_PACK_PROGRESS);
    localStorage.removeItem(STORAGE_KEYS.EVENTS);
  }
}

export function getUser(userId: string): User | undefined {
  return users.find((u) => u.id === userId);
}

export function getUserMask(
  userId: string,
  maskId: string
): UserMask | undefined {
  return userMasks.find((m) => m.user_id === userId && m.mask_id === maskId);
}

export function upsertUserMask(entry: UserMask): void {
  // User masks must be unique per (user_id, mask_id). Previously we keyed by `id`,
  // which allowed duplicate rows for the same mask and user.
  const matchingIdxs: number[] = [];
  for (let i = 0; i < userMasks.length; i += 1) {
    const m = userMasks[i];
    if (m.user_id === entry.user_id && m.mask_id === entry.mask_id) {
      matchingIdxs.push(i);
    }
  }

  if (matchingIdxs.length > 0) {
    const keepIdx = matchingIdxs[0];
    const existing = userMasks[keepIdx];

    // Preserve the existing id to avoid breaking any references.
    userMasks[keepIdx] = { ...entry, id: existing.id };

    // Remove any additional duplicates (self-heal old stores).
    for (let i = matchingIdxs.length - 1; i >= 1; i -= 1) {
      userMasks.splice(matchingIdxs[i], 1);
    }
  } else {
    userMasks.push(entry);
  }
  saveUserMasks();
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

export function getUserPackProgress(
  userId: string,
  packId: string
): UserPackProgress | undefined {
  return userPackProgress.find(
    (p) => p.user_id === userId && p.pack_id === packId
  );
}

export function updateUserPackProgress(progress: UserPackProgress): void {
  const idx = userPackProgress.findIndex(
    (p) => p.user_id === progress.user_id && p.pack_id === progress.pack_id
  );
  if (idx >= 0) {
    userPackProgress[idx] = progress;
  } else {
    userPackProgress.push(progress);
  }
  saveUserPackProgress();
}

export function appendEvent(evt: EventRow): void {
  events.push(evt);
  saveEvents();
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
