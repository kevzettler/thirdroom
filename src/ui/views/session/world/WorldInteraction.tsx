import { useSetAtom } from "jotai";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

import { InteractableType } from "../../../../engine/resource/schema";
import { InteractableAction } from "../../../../plugins/interaction/interaction.common";
import { useIsMounted } from "../../../hooks/useIsMounted";
import { useMainThreadContext } from "../../../hooks/useMainThread";
import { useMemoizedState } from "../../../hooks/useMemoizedState";
import { overlayWorldAtom } from "../../../state/overlayWorld";
import { InteractionState, useWorldInteraction } from "../../../hooks/useWorldInteraction";
import { Dialog } from "../../../atoms/dialog/Dialog";
import { EntityTooltip } from "../entity-tooltip/EntityTooltip";
import { getModule } from "../../../../engine/module/module.common";
import { PlayerModule } from "../../../../engine/player/Player.main";
import { Reticle } from "../reticle/Reticle";
import { useWorldLoader } from "../../../hooks/useWorldLoader";
import { World } from "../../../../client/world-client";
import { worldClient } from "../../../../client/world-client";

export interface IPortalProcess {
  joining?: boolean;
  error?: Error;
}

interface WorldInteractionProps {
  world: World;
}

export function WorldInteraction({ world }: WorldInteractionProps) {
  const mainThread = useMainThreadContext();
  const camRigModule = getModule(mainThread, PlayerModule);
  const navigate = useNavigate();

  const [activeEntity, setActiveEntity] = useMemoizedState<InteractionState | undefined>();
  const [portalProcess, setPortalProcess] = useMemoizedState<IPortalProcess>({});
  const [members, setMembers] = useState(false);

  const { exitWorld, loadAndEnterWorld } = useWorldLoader();
  const selectWorld = useSetAtom(overlayWorldAtom);
  const isMounted = useIsMounted();

  const handlePortalGrab = useCallback(
    async (interaction) => {
      try {
        setPortalProcess({});
        const { uri } = interaction;
        if (!uri) throw Error("Portal does not have valid world ID");

        // Simple world ID extraction (can be enhanced later)
        const worldId = uri.startsWith("world://") ? uri.replace("world://", "") : uri;

        if (worldId) {
          setPortalProcess({ joining: true });
          try {
            const newWorld = await worldClient.getWorldById(worldId);
            if (!isMounted()) return;

            setPortalProcess({});
            selectWorld(newWorld.id);
            exitWorld();
            await loadAndEnterWorld(newWorld);
            navigate(`/world/${newWorld.id}`);
          } catch (err) {
            if (!isMounted()) return;
            setPortalProcess({ error: err as Error });
          }
        }
      } catch (err) {
        if (!isMounted()) return;
        setPortalProcess({ error: err as Error });
      }
    },
    [selectWorld, exitWorld, loadAndEnterWorld, navigate, isMounted, setPortalProcess]
  );

  const handleInteraction = useCallback(
    (interaction?: InteractionState) => {
      if (!interaction) return setActiveEntity(undefined);
      const { interactableType, action, peerId } = interaction;

      if (action === InteractableAction.Grab) {
        if (interactableType === InteractableType.Player && typeof peerId === "string") {
          setMembers(true);
          document.exitPointerLock();
          return;
        }
        if (interactableType === InteractableType.Portal) {
          handlePortalGrab(interaction);
          return;
        }
      }

      if (interactableType === InteractableType.Player) {
        const entity: InteractionState = {
          ...interaction,
          name: peerId || "Player",
        };
        setActiveEntity(entity);
      }

      setActiveEntity(interaction);
    },
    [handlePortalGrab, setActiveEntity]
  );

  useWorldInteraction(mainThread, handleInteraction);

  return (
    <div>
      <Dialog open={members} onOpenChange={setMembers}>
        {/* Member list dialog removed - can be re-implemented with WebRTC peer list */}
        <div>Members feature coming soon</div>
      </Dialog>
      {!camRigModule.orbiting && <Reticle />}
      {activeEntity && !camRigModule.orbiting && (
        <EntityTooltip activeEntity={activeEntity} portalProcess={portalProcess} />
      )}
    </div>
  );
}
