import { useEffect, useRef } from "react";
import { Outlet } from "react-router-dom";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useAtomValue, useSetAtom } from "jotai";
import { KBarProvider } from "kbar";

import "./SessionView.css";
import { useInitMainThreadContext, MainThreadContextProvider } from "../../hooks/useMainThread";
import { Overlay } from "./overlay/Overlay";
import { SimpleOverlay } from "./overlay/SimpleOverlay";
import { StatusBar } from "./statusbar/StatusBar";
import { SimpleStatusBar } from "./statusbar/SimpleStatusBar";
import { LoadingScreen } from "../components/loading-screen/LoadingScreen";
import { useHomeWorld } from "../../hooks/useHomeWorld";
import { useUnknownWorldPath } from "../../hooks/useWorld";
import { useAutoJoinRoom } from "../../hooks/useAutoJoinRoom";
import { useHydrogen } from "../../hooks/useHydrogen";
import config from "../../../../config.json";
import { overlayWorldAtom } from "../../state/overlayWorld";
import { overlayVisibilityAtom } from "../../state/overlayVisibility";
import { CmdPanel, defaultActions } from "./cmd-panel/CmdPanel";
import { useAccountManagementAction, useLandingPageAction, useUserProfileAction } from "./cmd-panel/actions";
import { editorEnabledAtom } from "../../state/editor";
import { WhatsNew } from "./whats-new/WhatsNew";
import { FirefoxPerfAlert } from "./dialogs/FirefoxPerfAlert";

function RegisterKBarActions() {
  useUserProfileAction();
  useAccountManagementAction();
  useLandingPageAction();
  return null;
}

export default function SessionView() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mainThread = useInitMainThreadContext(canvasRef);
  // Use optional session - backend auth may not have Matrix session
  const { session } = useHydrogen(false);
  const overlayVisible = useAtomValue(overlayVisibilityAtom);
  const [worldId, worldAlias] = useUnknownWorldPath();
  const homeWorldId = useHomeWorld();
  const selectWorld = useSetAtom(overlayWorldAtom);
  // Only auto-join Matrix room if we have a Matrix session
  useAutoJoinRoom(session, config.repositoryRoomIdOrAlias);

  const editorEnabled = useAtomValue(editorEnabledAtom);

  useEffect(() => {
    if (!worldId && !worldAlias && homeWorldId) {
      selectWorld(homeWorldId);
    }
  }, [worldId, worldAlias, homeWorldId, selectWorld]);

  return (
    <DndProvider backend={HTML5Backend}>
      <KBarProvider
        actions={defaultActions}
        options={{
          disableScrollbarManagement: true,
        }}
      >
        <CmdPanel />
        <RegisterKBarActions />
        <div className="SessionView">
          <canvas className="SessionView__viewport" ref={canvasRef} />
          {mainThread ? (
            <MainThreadContextProvider value={mainThread}>
              <Outlet />
              {overlayVisible && (session ? <Overlay /> : <SimpleOverlay />)}
              {!editorEnabled && (session ? <StatusBar /> : <SimpleStatusBar />)}
              <FirefoxPerfAlert />
              {session && <WhatsNew />}
            </MainThreadContextProvider>
          ) : (
            <LoadingScreen message="Initializing engine..." />
          )}
        </div>
      </KBarProvider>
    </DndProvider>
  );
}
