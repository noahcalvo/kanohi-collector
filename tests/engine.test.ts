import { describe, it, expect, beforeEach } from "vitest";
import { openPack, equipMask } from "../lib/engine";
import { getUserMask, getUserPackProgress, resetStore, upsertUserMask } from "../lib/store";
import { PACK_UNITS_PER_PACK } from "../lib/constants";

const USER_ID = "user-1";
const PACK_ID = "free_daily_v1";

describe("engine", () => {
  beforeEach(() => {
    resetStore();
    const progress = getUserPackProgress(USER_ID, PACK_ID);
    if (progress) progress.fractional_units = PACK_UNITS_PER_PACK;
  });

  it("opens a pack and consumes units", () => {
    const result = openPack(USER_ID, PACK_ID, { seed: "seed-1" });
    expect(result.masks.length).toBe(2);
    const progress = getUserPackProgress(USER_ID, PACK_ID);
    expect(progress?.fractional_units).toBe(0);
    expect(progress?.pity_counter).toBe(result.pity_counter);
  });

  it("applies pity to force at least one rare+", () => {
    const progress = getUserPackProgress(USER_ID, PACK_ID);
    if (!progress) throw new Error("missing progress");
    progress.pity_counter = 20;
    progress.fractional_units = PACK_UNITS_PER_PACK;
    const result = openPack(USER_ID, PACK_ID, { seed: "pity-seed" });
    const hasRarePlus = result.masks.some((m) => m.rarity !== "COMMON");
    expect(hasRarePlus).toBe(true);
  });

  it("equips one mask per slot and clears previous occupant", () => {
    // Seed an extra mask
    upsertUserMask({
      id: "temp-mask",
      user_id: USER_ID,
      mask_id: "gen1_toa_01",
      owned_count: 1,
      essence: 0,
      level: 1,
      equipped_slot: "NONE",
      unlocked_colors: ["standard"],
      last_acquired_at: new Date(),
    });

    equipMask(USER_ID, "gen1_toa_02", "TOA");
    equipMask(USER_ID, "gen1_toa_01", "TOA");
    const maskA = getUserMask(USER_ID, "gen1_toa_02");
    const maskB = getUserMask(USER_ID, "gen1_toa_01");
    expect(maskA?.equipped_slot).toBe("NONE");
    expect(maskB?.equipped_slot).toBe("TOA");
  });
});
