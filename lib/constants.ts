export const RARITY_BASE_PROBS = {
  MYTHIC: 0.005,
  RARE: 0.05,
  COMMON: 0.945,
};

export const DISCOVERY_REROLL_CAP = 0.5;
export const DISCOVERY_ATTEMPTS_LIMIT = 3;
export const PACK_LUCK_CAP = 0.2; // 20%
export const PITY_THRESHOLD = 20;
export const GLOBAL_SEED_SALT = "kanohi-server-salt";

export const DUPLICATE_ESSENCE_BY_RARITY = {
  COMMON: 1,
  RARE: 5,
  MYTHIC: 50,
};

export const LEVEL_BASE_BY_RARITY = {
  COMMON: 5,
  RARE: 25,
  MYTHIC: 200,
};

export const MAX_LEVEL_BY_RARITY = {
  COMMON: 10,
  RARE: 5,
  MYTHIC: 3,
};

const PACK_UNIT_SECONDS_DEFAULT = 86400 / 5; // 5 units per day -> 1 pack
const PACK_UNIT_SECONDS_ENV = process.env.PACK_UNIT_SECONDS ?? process.env.NEXT_PUBLIC_PACK_UNIT_SECONDS;
const parsedPackUnitSeconds = PACK_UNIT_SECONDS_ENV ? Number(PACK_UNIT_SECONDS_ENV) : PACK_UNIT_SECONDS_DEFAULT;
export const PACK_UNIT_SECONDS = Number.isFinite(parsedPackUnitSeconds) ? parsedPackUnitSeconds : PACK_UNIT_SECONDS_DEFAULT;
export const PACK_UNITS_PER_PACK = 5;
export const MAX_FRIEND_BUFF_SOURCES = 5;
export const FRIEND_BUFF_PER_FRIEND = 0.0025; // 0.25%
