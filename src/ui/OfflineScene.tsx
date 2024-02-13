import { useRef, useEffect } from "react";

import { MainThread } from "../engine/MainThread";

export function OfflineScene() {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current) {
      MainThread(canvasRef.current).then(({ ctx, dispose }) => {
        const mainThread = ctx;
        console.log("********messageHandlers********", mainThread.messageHandlers.keys());
        console.log("*******modules*********", Array.from(mainThread.modules.keys()).map((m) => m.name));
        console.log("********systems********", mainThread.systems.map((s:any) => s.name));

        // Engine initialized, you can use ctx for further operations
        // Store dispose function for cleanup if necessary
      });
    }
  }, []);

  return (
    <div>
      <canvas ref={canvasRef} width="800" height="600" />
    </div>
  );
}
