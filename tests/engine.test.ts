import { describe, it, expect, beforeEach } from "vitest";
import { PACK_UNITS_PER_PACK } from "../lib/constants";
import { openPack, equipMask } from "../lib/engine";
import { createMemoryStore } from "../lib/store/memoryStore";

const USER_ID = "user-1";
const PACK_ID = "free_daily_v1";

describe("engine", () => {
  let store: ReturnType<typeof createMemoryStore>;

  beforeEach(() => {
    store = createMemoryStore({ seedUserId: USER_ID, seedPackId: PACK_ID });
  });

  it("opens a pack and consumes units", async () => {
    const result = await openPack(true, USER_ID, PACK_ID, { seed: "seed-1" }, store);
    expect(result.masks.length).toBe(2);
    const progress = await store.getUserPackProgress(USER_ID, PACK_ID);
    expect(progress?.fractional_units).toBe(PACK_UNITS_PER_PACK - PACK_UNITS_PER_PACK);
    expect(progress?.pity_counter).toBe(result.pity_counter);
  });

  it("applies pity to force at least one rare+", async () => {
    const progress = await store.getUserPackProgress(USER_ID, PACK_ID);
    if (!progress) throw new Error("missing progress");
    progress.pity_counter = 20;
    progress.fractional_units = PACK_UNITS_PER_PACK;
    await store.upsertUserPackProgress(progress);
    const result = await openPack(true, USER_ID, PACK_ID, { seed: "seed-1" }, store);
    const hasRarePlus = result.masks.some((m) => m.rarity !== "COMMON");
    expect(hasRarePlus).toBe(true);
  });

  it("equips one mask per slot and clears previous occupant", async () => {
    // Seed an extra mask
    await store.upsertUserMask({
      id: "temp-mask",
      user_id: USER_ID,
      mask_id: "2",
      owned_count: 1,
      essence: 0,
      level: 1,
      equipped_slot: "NONE",
      equipped_color: "standard",
      unlocked_colors: ["standard"],
      last_acquired_at: new Date(),
    });

    await equipMask(true, USER_ID, "2", "TOA", store);
    await equipMask(true, USER_ID, "1", "TOA", store);
    const maskA = await store.getUserMask(USER_ID, "2");
    const maskB = await store.getUserMask(USER_ID, "1");
    expect(maskA?.equipped_slot).toBe("NONE");
    expect(maskB?.equipped_slot).toBe("TOA");
  });

  it("does not crash when discovery reroll has no alternate candidates", async () => {
    // There is only one MYTHIC mask in the seed data; a discovery reroll used to
    // throw when it tried to exclude the current mask and resample.
    await store.upsertUserMask({
      id: "temp-mythic",
      user_id: USER_ID,
      mask_id: "13",
      owned_count: 1,
      essence: 0,
      level: 999,
      equipped_slot: "TOA",
      equipped_color: "standard",
      unlocked_colors: ["standard"],
      last_acquired_at: new Date(),
    });

    const progress = await store.getUserPackProgress(USER_ID, PACK_ID);
    if (!progress) throw new Error("missing progress");

    for (let i = 0; i < 50; i += 1) {
      progress.fractional_units = PACK_UNITS_PER_PACK;
      await store.upsertUserPackProgress(progress);
      await expect(openPack(true, USER_ID, PACK_ID, { seed: `seed-${i}` }, store)).resolves.toBeTruthy();
    }
  });
});
