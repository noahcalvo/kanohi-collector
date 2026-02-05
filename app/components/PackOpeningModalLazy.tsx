"use client";

import dynamic from "next/dynamic";
import type { EquipSlot, OpenResult } from "../../lib/types";
import type { PackOverlayStage } from "./PackOpeningModal";

// Lazy load the heavy PackOpeningModal component
const PackOpeningModal = dynamic(
  () => import("./PackOpeningModal").then((mod) => ({ default: mod.PackOpeningModal })),
  {
    ssr: false,
    loading: () => null,
  }
);

export type { PackOverlayStage };

export function PackOpeningModalLazy(props: {
  open: boolean;
  stage: PackOverlayStage;
  results: OpenResult | null;
  revealedCount: number;
  packsRemaining?: number;
  errorMessage?: string | null;
  actionErrorMessage?: string | null;
  onDismissActionError?: () => void;
  onRetry?: () => void;
  retrying?: boolean;
  onEquip?: (
    maskId: string,
    slot: EquipSlot,
    color?: string,
    transparent?: boolean
  ) => void;
  equipping?: string | null;
  onClose: () => void;
  onOpenNextPack?: () => void;
  onExitToCollection?: () => void;
  onAdvance?: () => void;
  currentToaEquipped?: {
    maskId: string;
    name: string;
    color?: string;
    transparent?: boolean;
  } | null;
  currentTuragaEquipped?: {
    maskId: string;
    name: string;
    color?: string;
    transparent?: boolean;
  } | null;
}) {
  // Only render when actually needed
  if (!props.open) return null;
  
  return <PackOpeningModal {...props} />;
}
