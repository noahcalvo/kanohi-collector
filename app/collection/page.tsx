import { getUserIdAllowGuest } from "../../lib/auth";
import { mePayload } from "../../lib/engine";
import { masks } from "../../lib/staticData";
import { CollectionClient } from "./components/CollectionClient";

export default async function CollectionPage() {
  // Fetch data on the server
  const { userId, isGuest } = await getUserIdAllowGuest();
  const initialMe = await mePayload(isGuest, userId);
  const allMasks = masks;
  return (
    <CollectionClient
      initialMe={initialMe}
      allMasks={allMasks}
      isGuest={isGuest}
    />
  );
}
