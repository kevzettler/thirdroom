import { Session } from "@thirdroom/hydrogen-view-sdk";
import { useEffect } from "react";

import { useRoom } from "./useRoom";

export function useAutoJoinRoom(session: Session | undefined, roomIdOrAlias: string) {
  const room = useRoom(session, roomIdOrAlias);

  useEffect(() => {
    // Only auto-join if we have a Matrix session
    if (session && room === undefined) {
      session.joinRoom(roomIdOrAlias);
    }
  }, [session, roomIdOrAlias, room]);

  return room;
}
