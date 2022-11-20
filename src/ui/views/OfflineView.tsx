import { useEffect, useState, useRef, ReactNode } from "react";
import { Outlet } from "react-router-dom";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

import "./session/SessionView.css";
import { useInitMainThreadContext, MainThreadContextProvider, useMainThreadContext } from "../hooks/useMainThread";
import { useEvent } from "../hooks/useEvent";
import { usePointerLockChange } from "../hooks/usePointerLockChange";
import { LoadingScreen } from "./components/loading-screen/LoadingScreen";
import { loadWorld, enterWorld } from "../../plugins/thirdroom/thirdroom.main";

function InputWrapper() {
  const [_isPointerLock, setIsPointerLock] = useState(false);
  const mainThread = useMainThreadContext();
  usePointerLockChange(mainThread.canvas, setIsPointerLock, []);

  useEvent(
    "click",
    () => {
      mainThread.canvas?.requestPointerLock();
    },
    mainThread.canvas,
    []
  );

  return null;
}

export default function OfflineView() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mainThread = useInitMainThreadContext(canvasRef);

  async function initWorld() {
    if (!mainThread) return null;
    await loadWorld(
      mainThread,
      "/TerraHomeworld2.glb",
      ""
    )
    enterWorld(mainThread);
    mainThread.canvas?.requestPointerLock();
  }

  useEffect(() => {
    initWorld();
  }, [mainThread]);


  return (
    <DndProvider backend={HTML5Backend}>
      <div className="SessionView">
        <canvas className="SessionView__viewport" ref={canvasRef} />
        {mainThread ? (
          <MainThreadContextProvider value={mainThread}>
            <Outlet />
            <InputWrapper />
            {/* <StatusBar /> */}
          </MainThreadContextProvider>
        ) : (
          <LoadingScreen message="Initializing engine..." />
        )}
      </div>
    </DndProvider>
  );
}
