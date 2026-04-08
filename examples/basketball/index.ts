/**
 * Basketball Court Example
 *
 * This example demonstrates how to use the Manifold engine to create
 * a simple third-person game with the basketball court scene.
 */

import { createEngine } from "../../src/manifold";

async function main() {
  // Get the canvas element
  const canvas = document.getElementById("game-canvas") as HTMLCanvasElement;

  if (!canvas) {
    throw new Error("Canvas element not found");
  }

  // Create the Manifold engine
  const engine = await createEngine({
    canvas,
    onReady: () => {
      console.log("Manifold engine is ready!");
    },
  });

  // Load the basketball court scene
  await engine.loadWorld({
    sceneUrl: "/gltf/basketball_court.glb",
  });

  console.log("World loaded!");

  // Enter the world (spawns the player)
  await engine.enterWorld();

  console.log("Entered world! Use WASD to move, mouse to look around.");
  console.log("Press V to toggle first-person/third-person camera.");
  console.log("Press B to toggle fly mode.");
  console.log("Press ESC to unlock the mouse cursor.");

  // Clean up on page unload
  window.addEventListener("beforeunload", () => {
    engine.dispose();
  });
}

// Start the game
main().catch(console.error);
