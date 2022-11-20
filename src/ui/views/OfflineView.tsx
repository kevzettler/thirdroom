import { useEffect, useRef } from "react";
import { Outlet } from "react-router-dom";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

import "./session/SessionView.css";
import { useInitMainThreadContext, MainThreadContextProvider } from "../hooks/useMainThread";
import { LoadingScreen } from "./components/loading-screen/LoadingScreen";
import { loadWorld, enterWorld } from "../../plugins/thirdroom/thirdroom.main";


export default function OfflineView() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mainThread = useInitMainThreadContext(canvasRef);

  async function initWorld() {
    if (mainThread) {
      await loadWorld(
        mainThread,
        "/TerraHomeworld2.glb",
        ""
      )
      enterWorld(mainThread);
    } else {
      console.error("missing main thread");
    }
  }

  useEffect(() => {
    initWorld();
  });

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="SessionView">
        <canvas className="SessionView__viewport" ref={canvasRef} />
        {mainThread ? (
          <MainThreadContextProvider value={mainThread}>
            <Outlet />
            {/* <StatusBar /> */}
          </MainThreadContextProvider>
        ) : (
          <LoadingScreen message="Initializing engine..." />
        )}
      </div>
    </DndProvider>
  );
}
