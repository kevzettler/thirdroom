import { useCallback, useEffect, useState } from "react";
import { useAtom } from "jotai";
import { useNavigate } from "react-router-dom";

import { MainContext } from "../../../../engine/MainThread";
import { registerMessageHandler } from "../../../../engine/module/module.common";
import { FetchProgressMessage, FetchProgressMessageType } from "../../../../engine/utils/fetchWithProgress.game";
import { Progress } from "../../../atoms/progress/Progress";
import { Text } from "../../../atoms/text/Text";
import { useMainThreadContext } from "../../../hooks/useMainThread";
import { bytesToSize, getPercentage } from "../../../utils/common";
import "./WorldLoading.css";
import { Button } from "../../../atoms/button/Button";
import { WorldPreviewCard } from "../../components/world-preview-card/WorldPreviewCard";
import { overlayVisibilityAtom } from "../../../state/overlayVisibility";
import { useWorldLoader } from "../../../hooks/useWorldLoader";
import { World } from "../../../../client/world-client";

interface WorldLoadProgress {
  loaded: number;
  total: number;
}

function useWorldLoadingProgress(): [() => void, WorldLoadProgress] {
  const engine = useMainThreadContext();
  const [loadProgress, setLoadProgress] = useState<WorldLoadProgress>({ loaded: 0, total: 0 });

  useEffect(() => {
    const onFetchProgress = (ctx: MainContext, message: FetchProgressMessage) => {
      setLoadProgress(message.status);
    };
    return registerMessageHandler(engine, FetchProgressMessageType, onFetchProgress);
  }, [engine]);

  const reset = useCallback(() => {
    setLoadProgress({ loaded: 0, total: 0 });
  }, []);

  return [reset, loadProgress];
}

export function SimpleWorldLoading({ world, loading, error }: { world: World; loading: boolean; error?: Error }) {
  const [overlayVisible] = useAtom(overlayVisibilityAtom);
  const [resetLoadProgress, loadProgress] = useWorldLoadingProgress();
  const { exitWorld, loadAndEnterWorld } = useWorldLoader();
  const navigate = useNavigate();

  useEffect(() => {
    resetLoadProgress();
  }, [resetLoadProgress, loading]);

  const navigateExitWorld = useCallback(() => {
    exitWorld();
    navigate("/");
  }, [navigate, exitWorld]);

  const handleReload = useCallback(() => {
    loadAndEnterWorld(world, { reload: true });
  }, [world, loadAndEnterWorld]);

  if (overlayVisible) return null;

  return (
    <>
      {error && (
        <div className="WorldLoading flex justify-center">
          <WorldPreviewCard
            title={world.name ?? "Unknown World"}
            desc={error.message}
            options={
              <div className="flex gap-xxs">
                <Button onClick={navigateExitWorld} fill="outline">
                  Exit
                </Button>
                <Button onClick={handleReload}>
                  Reload
                </Button>
              </div>
            }
          />
        </div>
      )}
      {!error && loading && (
        <div className="WorldLoading flex justify-center">
          <WorldPreviewCard
            title={world.name ?? "Unknown World"}
            desc={`Owner: ${world.ownerId}`}
            content={
              <div className="flex flex-column gap-xs">
                <Progress
                  variant="secondary"
                  max={100}
                  value={getPercentage(loadProgress.total, loadProgress.loaded)}
                />
                <div className="flex justify-between gap-md">
                  <Text variant="b3">{`Loading Scene: ${getPercentage(
                    loadProgress.total,
                    loadProgress.loaded
                  )}%`}</Text>
                  <Text variant="b3">{`${bytesToSize(loadProgress.loaded)} / ${bytesToSize(loadProgress.total)}`}</Text>
                </div>
              </div>
            }
            options={
              <div className="flex gap-xxs">
                <Button onClick={navigateExitWorld} fill="outline">
                  Cancel
                </Button>
              </div>
            }
          />
        </div>
      )}
    </>
  );
}
