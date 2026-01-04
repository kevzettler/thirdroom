import { useState } from "react";
import { useAtom, useSetAtom } from "jotai";

import { Category } from "../../components/category/Category";
import { CategoryHeader } from "../../components/category/CategoryHeader";
import { useWorlds } from "../../../hooks/useWorlds";
import { WorldSelector } from "./selector/WorldSelector";
import { Icon } from "../../../atoms/icon/Icon";
import ChevronRightIC from "../../../../../res/ic/chevron-right.svg";
import ChevronBottomIC from "../../../../../res/ic/chevron-bottom.svg";
import { EmptyState } from "../../components/empty-state/EmptyState";
import { Button } from "../../../atoms/button/Button";
import { overlayWorldAtom } from "../../../state/overlayWorld";
import { OverlayWindow, overlayWindowAtom } from "../../../state/overlayWindow";
import { Dots } from "../../../atoms/loading/Dots";

export function RoomListHome() {
  const { worlds, loading, error } = useWorlds();

  const [worldCat, setWorldCat] = useState(true);

  const [selectedWorldId, selectWorld] = useAtom(overlayWorldAtom);
  const setOverlayWindow = useSetAtom(overlayWindowAtom);

  if (loading) {
    return (
      <div className="flex justify-center items-center" style={{ minHeight: "400px" }}>
        <Dots />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        style={{ minHeight: "400px" }}
        heading="Error Loading Worlds"
        text={error}
        actions={<Button onClick={() => window.location.reload()}>Retry</Button>}
      />
    );
  }

  if (worlds.length === 0) {
    return (
      <EmptyState
        style={{ minHeight: "400px" }}
        heading="No Worlds"
        text="You haven't joined any worlds yet."
        actions={<Button onClick={() => setOverlayWindow({ type: OverlayWindow.CreateWorld })}>Create World</Button>}
      />
    );
  }

  return (
    <>
      {worlds.length > 0 && (
        <Category
          header={
            <CategoryHeader
              title="Worlds"
              after={<Icon src={worldCat ? ChevronBottomIC : ChevronRightIC} size="sm" color="surface" />}
              onClick={() => setWorldCat(!worldCat)}
            />
          }
        >
          {worldCat &&
            worlds.map((world) => {
              return (
                <WorldSelector
                  key={world.id}
                  isSelected={selectedWorldId === world.id}
                  onSelect={selectWorld}
                  world={world}
                />
              );
            })}
        </Category>
      )}
    </>
  );
}
