import type { TutorialStep } from "./constants";

export type TutorialProgressLike = {
  currentStep: TutorialStep;
  completedAt: Date | null;
  rareMaskGrantedAt: Date | null;
  starterPackGrantedAt: Date | null;
  starterPackOpenedAt: Date | null;
  accountPromptShownAt: Date | null;
};

export type EffectiveTutorialState = {
  effectiveStep: TutorialStep;
  reviewMode: boolean;
  canGrantRareMask: boolean;
  canGrantStarterPack: boolean;
  starterPackOpened: boolean;
};

const ORDER: readonly TutorialStep[] = [
  "INTRO_BIONICLE",
  "INTRO_MASKS_PURPOSE",
  "INTRO_GAME_USAGE",
  "CHOOSE_RARE_MASK",
  "OPEN_STARTER_PACK",
  "ACCOUNT_PROMPT",
  "COMPLETE_REDIRECT",
];

function nextInOrder(step: TutorialStep): TutorialStep {
  const idx = ORDER.indexOf(step);
  if (idx < 0) return "INTRO_BIONICLE";
  return ORDER[Math.min(idx + 1, ORDER.length - 1)];
}

function clampToValidStep(
  step: TutorialStep,
  opts: {
    reviewMode: boolean;
    isGuest: boolean;
    rareGranted: boolean;
    packGranted: boolean;
  },
): TutorialStep {
  // In review mode, we still allow visiting every step, but grant steps become non-granting.
  // We only auto-skip when a granting step is no longer valid for a non-review tutorial.
  if (opts.reviewMode) {
    // Registered users never see ACCOUNT_PROMPT; skip it.
    if (!opts.isGuest && step === "ACCOUNT_PROMPT") return "COMPLETE_REDIRECT";
    return step;
  }

  // Non-review mode: auto-advance through invalid granting steps.
  let cur: TutorialStep = step;
  while (true) {
    if (!opts.isGuest && cur === "ACCOUNT_PROMPT") {
      cur = "COMPLETE_REDIRECT";
      continue;
    }

    if (cur === "CHOOSE_RARE_MASK" && opts.rareGranted) {
      cur = nextInOrder(cur);
      continue;
    }

    if (cur === "OPEN_STARTER_PACK" && opts.packGranted) {
      cur = nextInOrder(cur);
      continue;
    }

    return cur;
  }
}

export function computeEffectiveTutorialState(
  progress: TutorialProgressLike,
  isGuest: boolean,
): EffectiveTutorialState {
  const reviewMode = Boolean(progress.completedAt);
  const rareGranted = Boolean(progress.rareMaskGrantedAt);
  const packGranted = Boolean(progress.starterPackGrantedAt);

  const baseStep: TutorialStep = progress.currentStep;

  const effectiveStep = clampToValidStep(baseStep, {
    reviewMode,
    isGuest,
    rareGranted,
    packGranted,
  });

  return {
    effectiveStep,
    reviewMode,
    canGrantRareMask: !reviewMode && !rareGranted,
    canGrantStarterPack: !reviewMode && !packGranted,
    starterPackOpened: Boolean(progress.starterPackOpenedAt),
  };
}

export function computeNextStep(
  current: TutorialStep,
  opts: {
    isGuest: boolean;
    reviewMode: boolean;
    rareGranted: boolean;
    packGranted: boolean;
  },
): TutorialStep {
  // Guardrails: don't let callers advance past granting steps unless already granted or review mode.
  if (!opts.reviewMode) {
    if (current === "CHOOSE_RARE_MASK" && !opts.rareGranted) return current;
    if (current === "OPEN_STARTER_PACK" && !opts.packGranted) return current;
  }

  const next = nextInOrder(current);
  return clampToValidStep(next, {
    reviewMode: opts.reviewMode,
    isGuest: opts.isGuest,
    rareGranted: opts.rareGranted,
    packGranted: opts.packGranted,
  });
}
