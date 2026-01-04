import { useAtomValue, useSetAtom } from "jotai";
import { useEffect, useState } from "react";

import { useIsMounted } from "../../../hooks/useIsMounted";
import { useWorldPath } from "../../../hooks/useWorld";
import { useWorldLoader } from "../../../hooks/useWorldLoader";
import { overlayVisibilityAtom } from "../../../state/overlayVisibility";
import { overlayWorldAtom } from "../../../state/overlayWorld";
import { worldAtom } from "../../../state/world";
import { SimpleWorldLoading } from "./SimpleWorldLoading";
import { WorldThumbnail } from "./WorldThumbnail";
import { SimpleWorldView } from "./SimpleWorldView";
import { editorEnabledAtom } from "../../../state/editor";
import { worldClient, World } from "../../../../client/world-client";

export default function WorldRootView() {
  const { entered, loading } = useAtomValue(worldAtom);
  const setWorld = useSetAtom(worldAtom);
  const isMounted = useIsMounted();
  const [error, setError] = useState<Error>();
  const [navigatedWorld, setNavigatedWorld] = useState<World | null>(null);
  const setOverlayVisibility = useSetAtom(overlayVisibilityAtom);
  const { loadAndEnterWorld, reloadWorld, exitWorld } = useWorldLoader();
  const selectWorld = useSetAtom(overlayWorldAtom);
  const [worldId, reloadId] = useWorldPath();
  const setEditorEnabled = useSetAtom(editorEnabledAtom);

  // Load world from API
  useEffect(() => {
    if (worldId) {
      worldClient
        .getWorldById(worldId)
        .then((world) => {
          setNavigatedWorld(world);
        })
        .catch((err) => {
          setError(err as Error);
          console.error("Failed to load world:", err);
        });
    } else {
      setNavigatedWorld(null);
    }
  }, [worldId]);

  /**
   * Handle loading and reloading
   */
  useEffect(() => {
    exitWorld();
    if (navigatedWorld) {
      (async () => {
        try {
          await loadAndEnterWorld(navigatedWorld);
        } catch (err) {
          setError(err as Error);
          console.error(err);
        }
      })();
    }
  }, [navigatedWorld, reloadId, selectWorld, loadAndEnterWorld, exitWorld, setWorld]);

  /**
   * Selects the world we are entered into for display in the overlay
   */
  useEffect(() => {
    if (navigatedWorld) {
      selectWorld(navigatedWorld.id);
    }
  }, [navigatedWorld, selectWorld]);

  /**
   * Hides the overlay while loading into a world
   */
  useEffect(() => {
    setOverlayVisibility(!loading && !entered);
  }, [setOverlayVisibility, entered, loading]);

  /**
   * Reloading - for now, just reload when world changes
   * TODO: Implement world update polling or WebSocket updates
   */
  useEffect(() => {
    setError(undefined);
    if (navigatedWorld && entered) {
      // Poll for world updates (simple implementation)
      // In production, you might want WebSocket updates
      const interval = setInterval(async () => {
        try {
          const updatedWorld = await worldClient.getWorldById(navigatedWorld.id);
          if (
            updatedWorld.sceneUrl !== navigatedWorld.sceneUrl ||
            updatedWorld.scriptUrl !== navigatedWorld.scriptUrl
          ) {
            setEditorEnabled(false);
            await reloadWorld(updatedWorld);
            setNavigatedWorld(updatedWorld);
          }
        } catch (err) {
          console.error("Failed to check for world updates:", err);
        }
      }, 5000); // Poll every 5 seconds

      return () => {
        clearInterval(interval);
      };
    }
  }, [navigatedWorld, entered, isMounted, reloadWorld, setEditorEnabled]);

  return (
    <>
      {navigatedWorld && entered && <SimpleWorldView world={navigatedWorld} />}
      <WorldThumbnail />
      {navigatedWorld && <SimpleWorldLoading world={navigatedWorld} loading={loading} error={error} />}
    </>
  );
}
