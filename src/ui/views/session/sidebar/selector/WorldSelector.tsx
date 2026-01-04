import { useState } from "react";
import { useSetAtom } from "jotai";

import { Avatar } from "../../../../atoms/avatar/Avatar";
import { AvatarOutline } from "../../../../atoms/avatar/AvatarOutline";
import { IconButton } from "../../../../atoms/button/IconButton";
import { getIdentifierColorNumber } from "../../../../utils/avatar";
import { RoomTile } from "../../../components/room-tile/RoomTile";
import { RoomTileTitle } from "../../../components/room-tile/RoomTileTitle";
import MoreHorizontalIC from "../../../../../../res/ic/more-horizontal.svg";
import { DropdownMenu } from "../../../../atoms/menu/DropdownMenu";
import { DropdownMenuItem } from "../../../../atoms/menu/DropdownMenuItem";
import { OverlayWindow, overlayWindowAtom } from "../../../../state/overlayWindow";
import { World } from "../../../../../client/world-client";
import { useAuth } from "../../../../hooks/useAuth";
import { worldClient } from "../../../../../client/world-client";

interface WorldSelectorProps {
  isSelected: boolean;
  onSelect: (worldId: string) => void;
  world: World;
}

export function WorldSelector({ isSelected, onSelect, world }: WorldSelectorProps) {
  const { user } = useAuth();
  const setOverlayWindow = useSetAtom(overlayWindowAtom);
  const [focused, setFocused] = useState(false);
  const isOwner = user?.id === world.ownerId;

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this world?")) {
      try {
        await worldClient.deleteWorld(world.id);
        window.location.reload();
      } catch (error) {
        console.error("Failed to delete world:", error);
        alert("Failed to delete world");
      }
    }
  };

  return (
    <RoomTile
      key={world.id}
      isActive={isSelected}
      isFocused={focused}
      avatar={
        (() => {
          const avatar = (
            <Avatar
              name={world.name || "Empty world"}
              size="xl"
              shape="circle"
              className="shrink-0"
              bgColor={`var(--usercolor${getIdentifierColorNumber(world.id)})`}
            />
          );
          if (isSelected) return <AvatarOutline>{avatar}</AvatarOutline>;
          return avatar;
        })()
      }
      onClick={() => onSelect(world.id)}
      content={
        <>
          <RoomTileTitle>{world.name || "Empty world"}</RoomTileTitle>
        </>
      }
      options={
        <DropdownMenu
          side="right"
          onOpenChange={setFocused}
          content={
            <>
              {isOwner && (
                <DropdownMenuItem
                  onSelect={() =>
                    setOverlayWindow({
                      type: OverlayWindow.WorldSettings,
                      roomId: world.id,
                    })
                  }
                >
                  Settings
                </DropdownMenuItem>
              )}
              {isOwner && (
                <DropdownMenuItem variant="danger" onSelect={handleDelete}>
                  Delete
                </DropdownMenuItem>
              )}
            </>
          }
        >
          <IconButton label="Options" iconSrc={MoreHorizontalIC} />
        </DropdownMenu>
      }
    />
  );
}
