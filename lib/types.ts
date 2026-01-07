export type Rarity = "COMMON" | "RARE" | "MYTHIC";
export type BuffType = "PACK_LUCK" | "TIMER_SPEED" | "DUPLICATE_EFF" | "DISCOVERY" | "VISUAL";
export type EquipSlot = "NONE" | "TOA" | "TURAGA";

export interface Mask {
  mask_id: string;
  generation: number;
  name: string;
  base_rarity: Rarity;
  base_color_distribution: Record<string, number>;
  base_image_ids: Record<string, string>;
  buff_type: BuffType;
  buff_base_value: number;
  max_level: number;
  description: string;
  is_unique_mythic?: boolean;
}

export interface User {
  id: string;
  username: string;
  created_at: Date;
  last_active_at: Date;
  settings: Record<string, unknown>;
  created_from_guest: boolean;
}

export interface UserMask {
  id: string;
  user_id: string;
  mask_id: string;
  owned_count: number;
  essence: number;
  level: number;
  equipped_slot: EquipSlot;
  unlocked_colors: string[];
  last_acquired_at: Date;
}

export interface Pack {
  pack_id: string;
  name: string;
  masks_per_pack: number;
  guaranteed_min_rarity_floor: Rarity;
  featured_generation?: number;
  created_at: Date;
}

export interface UserPackProgress {
  user_id: string;
  pack_id: string;
  fractional_units: number;
  last_unit_ts: Date;
  pity_counter: number;
  last_pack_claim_ts?: Date | null;
}

export interface Friend {
  id: string;
  user_id: string;
  friend_user_id: string;
  status: "PENDING" | "ACCEPTED" | "BLOCKED";
  created_at: Date;
}

export interface EventRow {
  event_id: string;
  user_id?: string;
  type: string;
  payload: Record<string, unknown>;
  timestamp: Date;
}

export interface DrawResultItem {
  mask_id: string;
  name: string;
  rarity: Rarity;
  color: string;
  is_new: boolean;
  essence_awarded: number;
  essence_remaining: number;
  final_essence_remaining: number;
  level_before: number;
  level_after: number;
  final_level_after: number;
  unlocked_colors: string[];
}

export interface OpenResult {
  masks: DrawResultItem[];
  pity_counter: number;
}

export interface CollectionMask {
  mask_id: string;
  name: string;
  rarity: Rarity;
  level: number;
  essence: number;
  owned_count: number;
  equipped_slot: EquipSlot;
  unlocked_colors: string[];
}

export interface MePayload {
  user: User;
  equipped: UserMask[];
  total_buffs: BuffTotals;
  next_pack_ready_in_seconds: number;
  fractional_units: number;
  unlocked_colors: Record<string, string[]>;
  collection: CollectionMask[];
}

export interface StatusPayload {
  pack_ready: boolean;
  time_to_ready: number;
  fractional_units: number;
  pity_counter: number;
}

export interface BuffTotals {
  pack_luck: number;
  timer_speed: number;
  duplicate_eff: number;
  discovery: number;
}
