import { Suspense } from "react";
import { getUserId } from "../lib/auth";
import { prisma } from "../lib/db/prisma";
import { mePayload, packStatus } from "../lib/engine";
import { prismaStore } from "../lib/store/prismaStore";
import { TUTORIAL_KEY } from "../lib/tutorial/constants";
import { Header } from "./components/Header";
import { HomeClient } from "./components/HomeClient";
import HomeLoading from "./loading";

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

  // Show a "Resume tutorial" CTA only if a tutorial progress row exists and is unfinished.
  const internalUser = await prismaStore.getOrCreateUser(isGuest, userId);
  const tutorialProgress = await (prisma as any).tutorialProgress.findUnique({
    where: {
      tutorialKey_userId: {
        tutorialKey: TUTORIAL_KEY,
        userId: internalUser.id,
      },
    },
    select: { completedAt: true },
  });
  const tutorialCta: "start" | "resume" | null = !tutorialProgress
    ? "start"
    : tutorialProgress.completedAt
      ? null
      : "resume";

  const initialStatus = await packStatus(isGuest, userId, "free_daily_v1");
  const initialMe = await mePayload(isGuest, userId);
  return (
    <HomeClient
      initialStatus={initialStatus}
      initialMe={initialMe}
      isGuest={isGuest}
      tutorialCta={tutorialCta}
    />
  );
}
