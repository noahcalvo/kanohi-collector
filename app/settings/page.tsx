import Link from "next/link";
import { getUserId } from "../../lib/auth";
import { mePayload } from "../../lib/engine";
import { SignOutButton } from "../components/SignOutButton";

export default async function SettingsPage() {
  const { userId, isGuest } = await getUserId();
  if (!userId) {
    throw new Error("No userId found in SettingsPage");
  }
  const me = await mePayload(isGuest, userId);
  const username = me?.user?.username || userId;
  const createdAt = me?.user?.created_at ? new Date(me.user.created_at) : null;
  const now = new Date();
  const ageDays = createdAt ? Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)) : null;

  return (
    <div className="card max-w-lg mx-auto mt-8">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      <div className="mb-2">
        <span className="font-semibold">ID:</span> {username}
      </div>
      <div className="mb-2">
        <span className="font-semibold">Account Age:</span>{" "}
        {createdAt ? `${ageDays} days` : "Unknown"}
      </div>
      {isGuest ? (
        <div className="mt-4 text-yellow-800 bg-yellow-50 border border-yellow-200 rounded p-3">
          You are playing as a guest.{" "}
          <Link href="/sign-up" className="underline">
            Create an account
          </Link>{" "}
          to save your progress.
        </div>
      ) : (
        <div className="mt-4">
          <SignOutButton />
        </div>
      )}
    </div>
  );
}
