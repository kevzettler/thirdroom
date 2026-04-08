/**
 * Manifold Engine - A high-performance multi-threaded 3D game engine
 *
 * This is the main entry point for the Manifold engine.
 * It provides a declarative API for initializing and running 3D games.
 */

import { MainThread, MainContext } from "./core/MainThread";
import { Thread, registerMessageHandler } from "./core/module/module.common";
import {
  ThirdRoomMessageType,
  LoadWorldMessage,
  EnterWorldMessage,
  WorldLoadedMessage,
  WorldLoadErrorMessage,
  EnteredWorldMessage,
  EnterWorldErrorMessage,
  LoadWorldOptions,
} from "./plugins/world-loader/world-loader.common";
import { createDeferred } from "./core/utils/Deferred";
import { createDisposables } from "./core/utils/createDisposables";

/**
 * Configuration options for camera modes
 */
export type CameraMode = "first-person" | "third-person";

/**
 * Player configuration options
 */
export interface PlayerConfig {
  /** Camera mode - defaults to "third-person" */
  cameraMode?: CameraMode;
  /** URL to the player avatar GLB file */
  avatarUrl?: string;
}

/**
 * Network configuration for multiplayer
 */
export interface NetworkConfig {
  /** Signaling server URL for WebRTC */
  signalingUrl?: string;
  /** Enable voice chat */
  enableVoice?: boolean;
}

/**
 * Options for loading a world/scene
 */
export interface LoadWorldConfig {
  /** URL to the GLB scene file */
  sceneUrl: string;
  /** Optional script URL for scene logic */
  scriptUrl?: string;
  /** File map for resolving relative URLs in the GLB */
  fileMap?: Map<string, string>;
  /** Player configuration overrides */
  playerConfig?: PlayerConfig;
}

/**
 * Options for entering a world
 */
export interface EnterWorldConfig {
  /** Peer ID for multiplayer - if not provided, single player mode */
  peerId?: string;
}

/**
 * Configuration for initializing the Manifold engine
 */
export interface ManifoldConfig {
  /** The canvas element to render to */
  canvas: HTMLCanvasElement;
  /** Network configuration for multiplayer */
  network?: NetworkConfig;
  /** Called when the engine is ready */
  onReady?: (engine: ManifoldEngine) => void;
}

/**
 * The Manifold engine instance
 */
export interface ManifoldEngine {
  /** The main thread context - for advanced usage */
  readonly ctx: MainContext;

  /** Load a GLB world/scene */
  loadWorld(config: LoadWorldConfig): Promise<void>;

  /** Enter the loaded world (spawns player) */
  enterWorld(config?: EnterWorldConfig): Promise<void>;

  /** Exit the current world */
  exitWorld(): void;

  /** Dispose of the engine and clean up resources */
  dispose(): void;

  /** Check if a world is currently loaded */
  readonly isWorldLoaded: boolean;

  /** Check if the player has entered the world */
  readonly isWorldEntered: boolean;
}

/**
 * Internal state for the engine
 */
interface ManifoldState {
  worldLoaded: boolean;
  worldEntered: boolean;
  messageId: number;
  environmentUrl?: string;
}

/**
 * Create and initialize a Manifold engine instance
 *
 * @example
 * ```typescript
 * import { createEngine } from "@manifold/engine";
 *
 * const engine = await createEngine({
 *   canvas: document.getElementById("game-canvas") as HTMLCanvasElement,
 * });
 *
 * await engine.loadWorld({
 *   sceneUrl: "/scenes/basketball-court.glb",
 * });
 *
 * await engine.enterWorld();
 * ```
 */
export async function createEngine(config: ManifoldConfig): Promise<ManifoldEngine> {
  const { canvas, onReady } = config;

  // Initialize the main thread (which spawns game and render workers)
  const { ctx, dispose: disposeMainThread } = await MainThread(canvas);

  const state: ManifoldState = {
    worldLoaded: false,
    worldEntered: false,
    messageId: 0,
    environmentUrl: undefined,
  };

  const engine: ManifoldEngine = {
    get ctx() {
      return ctx;
    },

    get isWorldLoaded() {
      return state.worldLoaded;
    },

    get isWorldEntered() {
      return state.worldEntered;
    },

    async loadWorld(loadConfig: LoadWorldConfig): Promise<void> {
      const { sceneUrl, scriptUrl, fileMap } = loadConfig;

      if (state.worldLoaded) {
        throw new Error("World already loaded. Call exitWorld() first.");
      }

      const loadingWorld = createDeferred<void>(false);
      const id = state.messageId++;

      let disposeHandlers: () => void;

      const onLoadWorld = (_ctx: MainContext, message: WorldLoadedMessage) => {
        if (message.id === id) {
          if (message.url === state.environmentUrl) {
            state.worldLoaded = true;
            loadingWorld.resolve(undefined);
          } else {
            loadingWorld.reject(new Error("Environment changed before it was finished loading."));
          }
          disposeHandlers();
        }
      };

      const onLoadWorldError = (_ctx: MainContext, message: WorldLoadErrorMessage) => {
        if (message.id === id) {
          loadingWorld.reject(new Error(message.error));
          disposeHandlers();
        }
      };

      disposeHandlers = createDisposables([
        registerMessageHandler(ctx, ThirdRoomMessageType.WorldLoaded, onLoadWorld),
        registerMessageHandler(ctx, ThirdRoomMessageType.WorldLoadError, onLoadWorldError),
      ]);

      state.environmentUrl = sceneUrl;

      const options: LoadWorldOptions = {};
      if (scriptUrl) {
        options.environmentScriptUrl = scriptUrl;
      }
      if (fileMap) {
        options.fileMap = fileMap;
      }

      ctx.sendMessage<LoadWorldMessage>(Thread.Game, {
        type: ThirdRoomMessageType.LoadWorld,
        id,
        environmentUrl: sceneUrl,
        options,
      });

      return loadingWorld.promise;
    },

    async enterWorld(enterConfig?: EnterWorldConfig): Promise<void> {
      if (!state.worldLoaded) {
        throw new Error("No world loaded. Call loadWorld() first.");
      }

      if (state.worldEntered) {
        throw new Error("Already in world. Call exitWorld() first.");
      }

      const enteringWorld = createDeferred<void>(false);
      const id = state.messageId++;

      let disposeHandlers: () => void;

      const onEnteredWorld = (_ctx: MainContext, message: EnteredWorldMessage) => {
        if (message.id === id) {
          state.worldEntered = true;
          enteringWorld.resolve(undefined);
          disposeHandlers();
        }
      };

      const onEnterWorldError = (_ctx: MainContext, message: EnterWorldErrorMessage) => {
        if (message.id === id) {
          enteringWorld.reject(new Error(message.error));
          disposeHandlers();
        }
      };

      disposeHandlers = createDisposables([
        registerMessageHandler(ctx, ThirdRoomMessageType.EnteredWorld, onEnteredWorld),
        registerMessageHandler(ctx, ThirdRoomMessageType.EnterWorldError, onEnterWorldError),
      ]);

      ctx.sendMessage<EnterWorldMessage>(Thread.Game, {
        type: ThirdRoomMessageType.EnterWorld,
        id,
        localPeerId: enterConfig?.peerId,
      });

      return enteringWorld.promise;
    },

    exitWorld(): void {
      if (!state.worldLoaded) {
        return;
      }

      ctx.sendMessage(Thread.Game, {
        type: ThirdRoomMessageType.ExitWorld,
      });

      state.worldLoaded = false;
      state.worldEntered = false;
      state.environmentUrl = undefined;
    },

    dispose(): void {
      engine.exitWorld();
      disposeMainThread();
    },
  };

  if (onReady) {
    onReady(engine);
  }

  return engine;
}

// Re-export commonly used types
export type { MainContext } from "./core/MainThread";
export { Thread } from "./core/module/module.common";
