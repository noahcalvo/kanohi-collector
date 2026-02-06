export const TUTORIAL_KEY = "bionicle_origins_v1" as const;

export const TUTORIAL_STEPS = [
  "INTRO_BIONICLE",
  "INTRO_MASKS_PURPOSE",
  "CHOOSE_RARE_MASK",
  "OPEN_STARTER_PACK",
  "ACCOUNT_PROMPT",
  "COMPLETE_REDIRECT",
] as const;

export type TutorialStep = (typeof TUTORIAL_STEPS)[number];
