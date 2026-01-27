import { describe, expect, it } from "vitest";
import type { TutorialStep } from "../lib/tutorial/constants";
import {
  computeEffectiveTutorialState,
  computeNextStep,
} from "../lib/tutorial/stepEngine";

function progress(overrides?: Partial<any>) {
  return {
    currentStep: "INTRO_BIONICLE" as TutorialStep,
    completedAt: null,
    rareMaskGrantedAt: null,
    starterPackGrantedAt: null,
    starterPackOpenedAt: null,
    accountPromptShownAt: null,
    ...overrides,
  };
}

describe("tutorial step engine", () => {
  it("respects currentStep when completed (review mode)", () => {
    const state = computeEffectiveTutorialState(
      progress({ completedAt: new Date(), currentStep: "INTRO_BIONICLE" }),
      true,
    );
    expect(state.reviewMode).toBe(true);
    expect(state.effectiveStep).toBe("INTRO_BIONICLE");
    expect(state.canGrantRareMask).toBe(false);
    expect(state.canGrantStarterPack).toBe(false);
  });

  it("auto-skips CHOOSE_RARE_MASK if already granted", () => {
    const state = computeEffectiveTutorialState(
      progress({
        currentStep: "CHOOSE_RARE_MASK",
        rareMaskGrantedAt: new Date(),
      }),
      true,
    );
    expect(state.effectiveStep).toBe("OPEN_STARTER_PACK");
  });

  it("auto-skips OPEN_STARTER_PACK if already granted", () => {
    const state = computeEffectiveTutorialState(
      progress({
        currentStep: "OPEN_STARTER_PACK",
        starterPackGrantedAt: new Date(),
      }),
      true,
    );
    expect(state.effectiveStep).toBe("ACCOUNT_PROMPT");
  });

  it("skips ACCOUNT_PROMPT for registered users", () => {
    const state = computeEffectiveTutorialState(
      progress({ currentStep: "ACCOUNT_PROMPT" }),
      false,
    );
    expect(state.effectiveStep).toBe("COMPLETE_REDIRECT");
  });

  it("does not advance past granting step when not granted", () => {
    const next = computeNextStep("CHOOSE_RARE_MASK", {
      isGuest: true,
      reviewMode: false,
      rareGranted: false,
      packGranted: false,
    });
    expect(next).toBe("CHOOSE_RARE_MASK");
  });
});
