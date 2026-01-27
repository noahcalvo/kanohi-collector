import type { TutorialStep } from "./constants";
import { masks } from "@/lib/staticData";

export const STARTER_MASK_IDS = ["1", "2", "3", "4", "5", "6"] as const;
export type StarterMaskId = (typeof STARTER_MASK_IDS)[number];

export function isStarterMaskId(maskId: string): maskId is StarterMaskId {
  return (STARTER_MASK_IDS as readonly string[]).includes(maskId);
}

export type StarterMaskRenderInfo = {
  maskId: StarterMaskId;
  name: string;
  originalColor: string;
  origin?: string;
  transparent?: boolean;
};

export function getStarterMaskRenderInfo(
  maskId: StarterMaskId,
): StarterMaskRenderInfo {
  const def = masks.find((m) => m.mask_id === maskId);
  if (!def) {
    throw new Error(`Starter mask definition missing for mask_id=${maskId}`);
  }
  return {
    maskId,
    name: def.name,
    originalColor: def.original_color,
    origin: (def as any).origin,
    transparent: (def as any).transparent,
  };
}

export function isGrantingStep(step: TutorialStep): boolean {
  return step === "CHOOSE_RARE_MASK" || step === "OPEN_STARTER_PACK";
}
