import { getUserId } from "../../lib/auth";
import { mePayload } from "../../lib/engine";
import { masks } from "../../lib/staticData";
import { CollectionClient } from "./components/CollectionClient";

export default async function CollectionPage() {
  // Fetch data on the server
  const { userId, isGuest } = await getUserId();
  if (!userId) {
    throw new Error("No userId found in CollectionPage");
  }
  const initialMe = await mePayload(isGuest, userId);
  const allMasks = masks;
  return <CollectionClient initialMe={initialMe} allMasks={allMasks} />;
}
