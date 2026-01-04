import { useSetAtom } from "jotai";
import { useCallback } from "react";
import config from "../../../config.json";

import { AudioModule } from "../../engine/audio/audio.main";
import { getModule } from "../../engine/module/module.common";
import {
  createWebRTCNetworkInterface,
  registerWebRTCNetworkInterface,
  provideWebRTCNetworkInterface,
} from "../../engine/network/createWebRTCNetworkInterface";
import { enterWorld, loadWorld, reloadWorld } from "../../plugins/thirdroom/thirdroom.main";
import { worldAtom } from "../state/world";
import { useAuth } from "./useAuth";
import { useMainThreadContext } from "./useMainThread";
import { World, worldClient } from "../../client/world-client";

export interface WorldLoader {
  loadAndEnterWorld: (
    world: World,
    options?: {
      reload?: boolean;
    }
  ) => Promise<void>;
  reloadWorld: (world: World) => Promise<void>;
  exitWorld: () => void;
}

// Convert asset URLs from mxc:// or relative paths to HTTP URLs
function resolveAssetUrl(url: string): string {
  if (url.startsWith("mxc://")) {
    // Convert mxc:// to HTTP asset URL
    const parts = url.replace("mxc://", "").split("/");
    const filename = parts[parts.length - 1];
    const backendUrl = config.backendUrl || "http://localhost:3001";
    return `${backendUrl}/api/assets/${filename}`;
  }
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  // Relative path - assume it's in public/gltf
  const backendUrl = config.backendUrl || "http://localhost:3001";
  const filename = url.split("/").pop() || url;
  return `${backendUrl}/api/assets/${filename}`;
}

export function useWorldLoader(): WorldLoader {
  const { user } = useAuth();
  const mainThread = useMainThreadContext();
  const setWorld = useSetAtom(worldAtom);
  const signalingUrl = config.signalingUrl || config.backendUrl || "http://localhost:3001";

  const exitWorldCallback = useCallback(async () => {
    provideWebRTCNetworkInterface((networkInterface) => {
      networkInterface?.dispose();
    });

    setWorld({ type: "CLOSE" });
  }, [setWorld]);

  const loadAndEnterWorldCallback = useCallback(
    async (world: World) => {
      if (!user) {
        throw new Error("Must be authenticated to load world");
      }

      const worldId = world.id;

      setWorld({ type: "LOAD", roomId: worldId });

      const maxObjectCap = world.maxMemberObjectCap;
      let environmentUrl = world.sceneUrl;
      let environmentScriptUrl = world.scriptUrl;

      if (typeof environmentUrl !== "string") {
        throw new Error("3D scene does not exist for this world.");
      }

      // Resolve asset URLs
      environmentUrl = resolveAssetUrl(environmentUrl);
      if (environmentScriptUrl) {
        environmentScriptUrl = resolveAssetUrl(environmentScriptUrl);
      }

      try {
        // Create network interface first to get the signaling peer ID
        const networkInterface = await createWebRTCNetworkInterface(mainThread, user.id, worldId, signalingUrl);
        
        // Load the world in parallel with network setup
        await loadWorld(mainThread, environmentUrl, {
          environmentScriptUrl,
          maxObjectCap,
        });

        registerWebRTCNetworkInterface(networkInterface);

        // Use the signaling peer ID for consistent peer identification
        await enterWorld(mainThread, networkInterface.localPeerId);

        const audio = getModule(mainThread, AudioModule);
        audio.context.resume().catch(() => console.error("Couldn't resume audio context"));

        setWorld({ type: "ENTER" });
      } catch (err: any) {
        throw new Error(err?.message ?? "Unknown error loading world.");
      }
    },
    [mainThread, user, setWorld, signalingUrl]
  );

  // keeps the call established and reloads the scene/script
  const reloadWorldCallback = useCallback(
    async (world: World) => {
      setWorld({ type: "LOAD", roomId: world.id });

      const maxObjectCap = world.maxMemberObjectCap;
      let environmentUrl = world.sceneUrl;
      let environmentScriptUrl = world.scriptUrl;

      if (typeof environmentUrl !== "string") {
        throw new Error("3D scene does not exist for this world.");
      }

      // Resolve asset URLs
      environmentUrl = resolveAssetUrl(environmentUrl);
      if (environmentScriptUrl) {
        environmentScriptUrl = resolveAssetUrl(environmentScriptUrl);
      }

      await reloadWorld(mainThread, environmentUrl, {
        environmentScriptUrl,
        maxObjectCap,
      });

      setWorld({ type: "ENTER" });
    },
    [setWorld, mainThread]
  );

  return {
    loadAndEnterWorld: loadAndEnterWorldCallback,
    exitWorld: exitWorldCallback,
    reloadWorld: reloadWorldCallback,
  };
}
