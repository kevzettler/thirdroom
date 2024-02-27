import { quat, vec3 } from "gl-matrix";
import { addComponent, defineComponent } from "bitecs";
import { addChild } from "../../engine/component/transform";
import { enableActionMap } from "../../engine/input/ActionMappingSystem";
import { defineModule, getModule } from "../../engine/module/module.common";
import { GameContext } from "../../engine/GameTypes";
import { loadGLTF, loadDefaultGLTFScene, createNodeFromGLTFURI } from "../../engine/gltf/gltf.game";
import { RemoteNode, RemoteScene, RemoteEnvironment, addObjectToWorld, RemoteImage, RemoteReflectionProbe, RemoteTexture, RemoteSampler } from "../../engine/resource/RemoteResources";
import { SamplerMapping } from "../../engine/resource/schema";
import { InputModule } from "../../engine/input/input.game";
import {
  createRemoteResourceManager
} from "../../engine/resource/resource.game"
import { CameraRigType, CameraRigActionMap, addCameraRig } from "../../engine/player/CameraRig";
import { CharacterControllerActionMap } from "../../engine/player/CharacterController";
import { FlyCharacterControllerActionMap, FlyControls } from "../../engine/player/FlyCharacterController";
const Player = defineComponent({});
const OurPlayer = defineComponent({});


export const WingRivalsModule = defineModule<GameContext, {}>({
  name: "wingrivals",
  create() {
    console.log("********** wing rivals create******");
    return {}
  },
  async init(ctx) {
    console.log("******wing rivals init*********");

   const resourceManager = createRemoteResourceManager(ctx, "environment");

    const sceneGLTFResource = await loadGLTF(ctx, "/gltf/Omega_Island_No_Sky_No_Sun_No_Trees.glb", {
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
          flipY: false,
        }),
        sampler: new RemoteSampler(ctx.resourceManager, {
          mapping: SamplerMapping.EquirectangularRefractionMapping,
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

    loadGLTF(ctx, "/gltf/fighter01.glb", {
      resourceManager
    });
    const ship = createNodeFromGLTFURI(ctx, "/gltf/fighter01.glb");
    addChild(container, ship);

    addComponent(ctx.world, FlyControls, container.eid);
    FlyControls.set(container.eid, {
      speed: 1000,
    });

    const [camera] = addCameraRig(ctx, container, CameraRigType.PointerLock, [0, 5, 5]);


    addComponent(ctx.world, Player, container.eid);
    addComponent(ctx.world, OurPlayer, container.eid);
    addObjectToWorld(ctx, container);

    // set the active camera & input controller to this entity's
    ctx.worldResource.activeCameraNode = camera;
    ctx.worldResource.activeAvatarNode = container;

    container.position.set(vec3.fromValues(0, 400, 0));
    container.quaternion.set(quat.create());


    const input = getModule(ctx, InputModule);
    enableActionMap(input, CameraRigActionMap);
    enableActionMap(input, CharacterControllerActionMap);
    enableActionMap(input, FlyCharacterControllerActionMap);
  }
});
