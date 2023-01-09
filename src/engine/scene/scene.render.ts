import { Color } from "three";

import { getModule } from "../module/module.common";
import { updateSceneReflectionProbe } from "../reflection-probe/reflection-probe.render";
import { RendererModule } from "../renderer/renderer.render";
import { RenderThreadState } from "../renderer/renderer.render";
import { RenderNode, RenderScene, RenderWorld } from "../resource/resource.render";

const blackBackground = new Color(0x000000);

export function updateActiveSceneResource(ctx: RenderThreadState, activeScene: RenderScene | undefined) {
  const rendererModule = getModule(ctx, RendererModule);

  if (activeScene) {
    rendererModule.scene.visible = true;

    const currentBackgroundTextureResourceId = activeScene.currentBackgroundTextureResourceId;
    const nextBackgroundTextureResourceId = activeScene.backgroundTexture?.eid || 0;

    if (nextBackgroundTextureResourceId !== currentBackgroundTextureResourceId) {
      if (activeScene.backgroundTexture) {
        rendererModule.scene.background = activeScene.backgroundTexture.texture;
      } else {
        rendererModule.scene.background = null;
      }
    }

    activeScene.currentBackgroundTextureResourceId = nextBackgroundTextureResourceId;

    rendererModule.renderPipeline.bloomPass.strength = activeScene.bloomStrength;

    updateSceneReflectionProbe(ctx, activeScene);

    if (rendererModule.enableMatrixMaterial) {
      rendererModule.scene.overrideMaterial = rendererModule.matrixMaterial;
      rendererModule.scene.background = blackBackground;
    } else {
      rendererModule.scene.overrideMaterial = null;
      rendererModule.scene.background = activeScene.backgroundTexture?.texture || null;
    }
  } else {
    rendererModule.scene.visible = false;
  }
}

export function updateWorldVisibility(worldResource: RenderWorld) {
  if (worldResource.environment) {
    updateSceneVisibility(worldResource.environment.privateScene);
    updateSceneVisibility(worldResource.environment.publicScene);
  }

  if (worldResource.firstNode) {
    updateNodeVisibility(worldResource.firstNode, true);
  }

  updateSceneVisibility(worldResource.persistentScene);
}

function updateSceneVisibility(scene: RenderScene) {
  let curChild = scene.firstNode;

  while (curChild) {
    updateNodeVisibility(curChild, true);
    curChild = curChild.nextSibling;
  }
}

function updateNodeVisibility(node: RenderNode, parentVisibility: boolean) {
  node.object3DVisible = node.visible && parentVisibility;

  let curChild = node.firstChild;

  while (curChild) {
    updateNodeVisibility(curChild, node.object3DVisible);
    curChild = curChild.nextSibling;
  }
}
