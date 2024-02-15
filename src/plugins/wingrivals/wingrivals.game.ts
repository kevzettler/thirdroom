import { quat, vec3 } from "gl-matrix";
import { addComponent, defineComponent, defineQuery, Types } from "bitecs";

import { defineModule } from "../../engine/module/module.common";
import { GameContext } from "../../engine/GameTypes";
import { loadGLTF, loadDefaultGLTFScene } from "../../engine/gltf/gltf.game";
import { RemoteNode, RemoteScene, RemoteEnvironment, addObjectToWorld, RemoteImage, RemoteReflectionProbe, RemoteTexture, RemoteSampler } from "../../engine/resource/RemoteResources";
import { SamplerMapping } from "../../engine/resource/schema";
import {
  createRemoteResourceManager
} from "../../engine/resource/resource.game"
import { createRemotePerspectiveCamera } from "../../engine/camera/camera.game";
import { addChild } from "../../engine/component/transform";
import { CameraRigType } from "../../engine/player/CameraRig";

const Player = defineComponent({});
const OurPlayer = defineComponent({});
interface IFlyPlayerRig {
  speed: number;
}
export const FlyControls: Map<number, IFlyPlayerRig> = new Map();
export const flyControlsQuery = defineQuery([FlyControls]);

export const CameraRef = defineComponent({ eid: Types.eid });


interface PitchComponent {
  type: CameraRigType;
  target: number;
  pitch: number;
  maxAngle: number;
  minAngle: number;
  sensitivity: number;
}
interface YawComponent {
  type: CameraRigType;
  target: number;
  sensitivity: number;
  snapTurnDisabled: boolean;
}
const DEFAULT_SENSITIVITY = 100;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 10;

interface ZoomComponent {
  type: CameraRigType;
  target: number;
  min: number;
  max: number;
}
export const PitchComponent = new Map<number, PitchComponent>();
export const YawComponent = new Map<number, YawComponent>();
export const ZoomComponent = new Map<number, ZoomComponent>();


export const WingRivalsModule = defineModule<GameContext, {}>({
  name: "wingrivals",
  create() {
    console.log("********** wing rivals create******");
    return {}
  },
  async init(ctx) {
    console.log("******wing rivals init*********");

   const resourceManager = createRemoteResourceManager(ctx, "environment");

   const sceneGLTFResource = await loadGLTF(ctx, "/gltf/omega-island.glb", {
     resourceManager,
   });

  const environmentScene = loadDefaultGLTFScene(ctx, sceneGLTFResource, {
    createDefaultMeshColliders: true,
    rootIsStatic: true,
  }) as RemoteScene;

    if (!environmentScene.reflectionProbe || !environmentScene.backgroundTexture) {
      const defaultEnvironmentMapTexture = new RemoteTexture(ctx.resourceManager, {
        name: "Environment Map Texture",
        source: new RemoteImage(ctx.resourceManager, {
          name: "Environment Map Image",
          uri: "/cubemap/clouds_2k.hdr",
          flipY: true,
        }),
        sampler: new RemoteSampler(ctx.resourceManager, {
          mapping: SamplerMapping.EquirectangularReflectionMapping,
        }),
      });

      if (!environmentScene.reflectionProbe) {
        environmentScene.reflectionProbe = new RemoteReflectionProbe(ctx.resourceManager, {
          reflectionProbeTexture: defaultEnvironmentMapTexture,
        });
      }

      if (!environmentScene.backgroundTexture) {
        environmentScene.backgroundTexture = defaultEnvironmentMapTexture;
      }
    }

  const transientScene = new RemoteScene(ctx.resourceManager, {
    name: "Transient Scene",
  });

  ctx.worldResource.environment = new RemoteEnvironment(ctx.resourceManager, {
    publicScene: environmentScene,
    privateScene: transientScene,
  });


  const container = new RemoteNode(ctx.resourceManager);
    addComponent(ctx.world, FlyControls, container.eid);
    FlyControls.set(container.eid, {
      speed: 10,
    });

    // add camera anchor
    const cameraAnchor = new RemoteNode(ctx.resourceManager);
    cameraAnchor.name = "Camera Anchor";

    // add camera
    const camera = new RemoteNode(ctx.resourceManager, {
      camera: createRemotePerspectiveCamera(ctx),
    });

    addComponent(ctx.world, CameraRef, container.eid);
    CameraRef.eid[container.eid] = camera.eid;

    // add hierarchy
    addChild(container, cameraAnchor);
    addChild(cameraAnchor, camera);

    // add targets
    addComponent(ctx.world, PitchComponent, container.eid);
    const pitch: PitchComponent = {
      type: CameraRigType.PointerLock,
      target: cameraAnchor.eid,
      pitch: 0,
      maxAngle: 89,
      minAngle: -89,
      sensitivity: DEFAULT_SENSITIVITY,
    };
    PitchComponent.set(container.eid, pitch);


    addComponent(ctx.world, YawComponent, container.eid);
    const yaw: YawComponent = {
      type: CameraRigType.PointerLock,
      target: container.eid,
      sensitivity: DEFAULT_SENSITIVITY,
      snapTurnDisabled: false,
    };
    YawComponent.set(container.eid, yaw);


    addComponent(ctx.world, ZoomComponent, container.eid);
    const zoom: ZoomComponent = {
      type: CameraRigType.PointerLock,
      target: camera.eid,
      min: ZOOM_MIN,
      max: ZOOM_MAX,
    };
    ZoomComponent.set(container.eid, zoom);


    addComponent(ctx.world, Player, container.eid);
    addComponent(ctx.world, OurPlayer, container.eid);
    addObjectToWorld(ctx, container);

    // set the active camera & input controller to this entity's
    ctx.worldResource.activeCameraNode = camera;
    ctx.worldResource.activeAvatarNode = container;

    container.position.set(vec3.fromValues(0, 400, 0));
    container.quaternion.set(quat.create());

  // if (environmentScript) {
//   addScriptComponent(ctx, environmentScene, environmentScript);
//   environmentScript.entered();
//   }

    // const camera = new RemoteNode(ctx.resourceManager, {
    //   camera: createRemotePerspectiveCamera(ctx),
    // });

  }
});
