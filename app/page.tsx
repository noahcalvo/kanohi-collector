import { Suspense } from "react";
import { getUserId } from "../lib/auth";
import { mePayload, packStatus } from "../lib/engine";
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
  const initialStatus = await packStatus(isGuest, userId, "free_daily_v1");
  const initialMe = await mePayload(isGuest, userId);
  return (
    <HomeClient
      initialStatus={initialStatus}
      initialMe={initialMe}
      isGuest={isGuest}
    />
  );
}
