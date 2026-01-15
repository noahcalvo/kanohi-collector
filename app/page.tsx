import { Suspense } from "react";
import { getUserIdOrThrow } from "../lib/auth";
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
  const userId = await getUserIdOrThrow();
  const initialStatus = await packStatus(userId, "free_daily_v1");
  const initialMe = await mePayload(userId);
  return <HomeClient initialStatus={initialStatus} initialMe={initialMe} />;
}
