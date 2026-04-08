/**
 * Manifold Engine
 *
 * A high-performance multi-threaded 3D game engine for the web.
 *
 * @example
 * ```typescript
 * import { createEngine } from "./manifold";
 *
 * const engine = await createEngine({
 *   canvas: document.getElementById("game-canvas") as HTMLCanvasElement,
 * });
 *
 * await engine.loadWorld({ sceneUrl: "/scenes/my-world.glb" });
 * await engine.enterWorld();
 * ```
 */

// Main entry point
export { createEngine } from "./Manifold";
export type {
  ManifoldConfig,
  ManifoldEngine,
  LoadWorldConfig,
  EnterWorldConfig,
  PlayerConfig,
  NetworkConfig,
  CameraMode,
} from "./Manifold";

// Core types for advanced usage
export type { MainContext } from "./core/MainThread";
export type { GameContext } from "./core/GameTypes";
export { Thread } from "./core/module/module.common";

// Presets
export { ThirdPersonActionPreset } from "./presets/third-person-action";
export type { ManifoldPreset } from "./presets/third-person-action";
