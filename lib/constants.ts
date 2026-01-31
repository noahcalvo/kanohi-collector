export const RARITY_BASE_PROBS = {
  MYTHIC: 0.005,
  RARE: 0.05,
  COMMON: 0.945,
};

export const DISCOVERY_REROLL_CAP = 0.5;
export const DISCOVERY_ATTEMPTS_LIMIT = 3;
export const PACK_LUCK_CAP = 0.2; // 20%
export const PACK_CD_CAP = 0.60; // 60%
export const COLOR_BUFF_CAP = 1.5; // 150%
export const PITY_THRESHOLD = 20;
export const GLOBAL_SEED_SALT = "kanohi-server-salt";

export const DUPLICATE_ESSENCE = 100

export const LEVEL_BASE = 500;

export const MAX_LEVEL_BY_RARITY = {
  COMMON: 10,
  RARE: 5,
  MYTHIC: 3,
};

const PACK_UNIT_SECONDS_DEFAULT = 21600 / 5; // 5 units per 6h -> 1 pack
const PACK_UNIT_SECONDS_ENV = process.env.PACK_UNIT_SECONDS ?? process.env.NEXT_PUBLIC_PACK_UNIT_SECONDS;
const parsedPackUnitSeconds = PACK_UNIT_SECONDS_ENV ? Number(PACK_UNIT_SECONDS_ENV) : PACK_UNIT_SECONDS_DEFAULT;
export const PACK_UNIT_SECONDS = Number.isFinite(parsedPackUnitSeconds) ? parsedPackUnitSeconds : PACK_UNIT_SECONDS_DEFAULT;
export const PACK_UNITS_PER_PACK = 5;
// Pack stacking: maximum number of full packs a player can store without opening.
// Additional storage comes from PACK_STACKING buffs.
export const BASE_PACK_STORAGE_CAP = 3;
export const MAX_FRIEND_BUFF_SOURCES = 5;
export const FRIEND_BUFF_PER_FRIEND = 0.0025; // 0.25%
