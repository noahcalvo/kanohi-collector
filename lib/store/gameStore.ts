import type { EventRow, User, UserMask, UserPackProgress } from "../types";

export type GameStore = {
  getOrCreateUser: (kanohiId: boolean, userId: string) => Promise<User>;

  getUserMask: (
    userId: string,
    maskId: string,
  ) => Promise<UserMask | undefined>;
  getUserMasks: (userId: string) => Promise<UserMask[]>;
  upsertUserMask: (entry: UserMask) => Promise<void>;

  getUserPackProgress: (
    userId: string,
    packId: string,
  ) => Promise<UserPackProgress | undefined>;
  upsertUserPackProgress: (progress: UserPackProgress) => Promise<void>;

  appendEvent: (evt: EventRow) => Promise<void>;
};
