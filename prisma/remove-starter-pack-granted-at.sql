-- Removes the deprecated "starterPackGrantedAt" column from TutorialProgress.
-- Safe to run multiple times.

ALTER TABLE "TutorialProgress"
  DROP COLUMN IF EXISTS "starterPackGrantedAt";
