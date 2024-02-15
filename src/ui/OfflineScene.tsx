import { useRef, useEffect } from "react";

import { MainThread } from "../engine/MainThread";

export default function OfflineScene() {
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
    <div style={{ width: "100%", height: "100%" }}>
      <h1 style={{ position: 'absolute', top: "0px" }}>Offline Manifold....</h1>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
