import { Room, Session } from "@thirdroom/hydrogen-view-sdk";

import { aliasToRoomId } from "../utils/matrixUtils";
import { useObservableMap } from "./useObservableMap";

export function useRoom(session: Session | undefined, roomIdOrAlias: string | undefined): Room | undefined {
  // Return undefined if no Matrix session
  const roomId = session && roomIdOrAlias?.startsWith("#") 
    ? aliasToRoomId(session.rooms, roomIdOrAlias) 
    : roomIdOrAlias;

  const rooms = useObservableMap(() => session?.rooms, [session?.rooms]);
  return roomId ? rooms.get(roomId) : undefined;
}
