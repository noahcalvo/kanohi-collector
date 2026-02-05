import { Suspense } from "react";
import { getUserId } from "../lib/auth";
import { prisma } from "../lib/db/prisma";
import { mePayload, packStatus } from "../lib/engine";
import { prismaStore } from "../lib/store/prismaStore";
import { TUTORIAL_KEY } from "../lib/tutorial/constants";
import { Header } from "./components/Header";
import { HomeClient } from "./components/HomeClient";
import HomeLoading from "./loading";

// Revalidate every 60 seconds for dynamic data
export const revalidate = 60;

export default function Home() {
  return (
    <div className="space-y-6">
      <Header />
      <Suspense fallback={<HomeLoading />}>
        <MainContent />
      </Suspense>
    </div>
  );
}

async function MainContent() {
  const { userId, isGuest } = await getUserId();
  if (!userId) {
    throw new Error("No userId found in MainContent");
  }

  // Parallelize independent data fetching for better performance
  const [internalUser, initialStatus, initialMe] = await Promise.all([
    prismaStore.getOrCreateUser(isGuest, userId),
    packStatus(isGuest, userId, "free_daily_v1"),
    mePayload(isGuest, userId),
  ]);

  // Show a "Resume tutorial" CTA only if a tutorial progress row exists and is unfinished.
  type TutorialProgressRow = { completedAt: Date | null } | null;
  type TutorialProgressDelegate = {
    findUnique: (args: {
      where: {
        tutorialKey_userId: {
          tutorialKey: string;
          userId: string;
        };
      };
      select: { completedAt: true };
    }) => Promise<TutorialProgressRow>;
  };
  const tutorialProgressDelegate = (
    prisma as unknown as { tutorialProgress?: TutorialProgressDelegate }
  ).tutorialProgress;
  const tutorialProgress: TutorialProgressRow = tutorialProgressDelegate
    ? await tutorialProgressDelegate.findUnique({
        where: {
          tutorialKey_userId: {
            tutorialKey: TUTORIAL_KEY,
            userId: internalUser.id,
          },
        },
        select: { completedAt: true },
      })
    : null;

  const tutorialCta: "start" | "resume" | null = !tutorialProgress
    ? "start"
    : tutorialProgress.completedAt
      ? null
      : "resume";

  return (
    <HomeClient
      initialStatus={initialStatus}
      initialMe={initialMe}
      isGuest={isGuest}
      tutorialCta={tutorialCta}
    />
  );
}
