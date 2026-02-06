import type { TutorialStep } from "./constants";

export type TutorialProgressLike = {
  currentStep: TutorialStep;
  completedAt: Date | null;
  rareMaskGrantedAt: Date | null;
  starterPackOpenedAt: Date | null;
  accountPromptShownAt: Date | null;
};

export type EffectiveTutorialState = {
  effectiveStep: TutorialStep;
  reviewMode: boolean;
  canGrantRareMask: boolean;
  starterPackOpened: boolean;
};

const ORDER: readonly TutorialStep[] = [
  "INTRO_BIONICLE",
  "INTRO_MASKS_PURPOSE",
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

function indexOfStep(step: TutorialStep): number {
  const idx = ORDER.indexOf(step);
  return idx < 0 ? 0 : idx;
}

function clampToValidStep(
  step: TutorialStep,
  opts: {
    reviewMode: boolean;
    isGuest: boolean;
    rareGranted: boolean;
    packOpened: boolean;
  },
): TutorialStep {
  // In review mode, we still allow visiting every step, but grant steps become non-granting.
  // We only auto-skip when a granting step is no longer valid for a non-review tutorial.
  if (opts.reviewMode) {
    // Registered users never see ACCOUNT_PROMPT; skip it.
    if (!opts.isGuest && step === "ACCOUNT_PROMPT") return "COMPLETE_REDIRECT";
    return step;
  }

  // Non-review mode: do not allow progressing past required actions.
  // If the user somehow ends up after the gating step (e.g. they exited mid-tutorial),
  // we "rewind" their effective step back to the earliest incomplete gate.
  const chooseRareIdx = indexOfStep("CHOOSE_RARE_MASK");
  const openPackIdx = indexOfStep("OPEN_STARTER_PACK");
  let cur: TutorialStep = step;

  const curIdx = indexOfStep(cur);
  if (!opts.rareGranted && curIdx > chooseRareIdx) {
    cur = "CHOOSE_RARE_MASK";
  } else if (opts.rareGranted && !opts.packOpened && curIdx > openPackIdx) {
    cur = "OPEN_STARTER_PACK";
  }

  // Registered users never see ACCOUNT_PROMPT; skip it.
  if (!opts.isGuest && cur === "ACCOUNT_PROMPT") return "COMPLETE_REDIRECT";

  // Auto-advance through granting steps that are no longer applicable.
  while (true) {
    if (cur === "CHOOSE_RARE_MASK" && opts.rareGranted) {
      cur = nextInOrder(cur);
      continue;
    }

    if (cur === "OPEN_STARTER_PACK" && opts.packOpened) {
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
  const packOpened = Boolean(progress.starterPackOpenedAt);

  const baseStep: TutorialStep = progress.currentStep;

  const effectiveStep = clampToValidStep(baseStep, {
    reviewMode,
    isGuest,
    rareGranted,
    packOpened,
  });

  return {
    effectiveStep,
    reviewMode,
    canGrantRareMask: !reviewMode && !rareGranted,
    starterPackOpened: packOpened,
  };
}

export function computeNextStep(
  current: TutorialStep,
  opts: {
    isGuest: boolean;
    reviewMode: boolean;
    rareGranted: boolean;
    packOpened: boolean;
  },
): TutorialStep {
  // Guardrails: don't let callers advance past gating steps unless satisfied or review mode.
  if (!opts.reviewMode) {
    if (current === "CHOOSE_RARE_MASK" && !opts.rareGranted) return current;
    if (current === "OPEN_STARTER_PACK" && !opts.packOpened) return current;
  }

  const next = nextInOrder(current);
  return clampToValidStep(next, {
    reviewMode: opts.reviewMode,
    isGuest: opts.isGuest,
    rareGranted: opts.rareGranted,
    packOpened: opts.packOpened,
  });
}
