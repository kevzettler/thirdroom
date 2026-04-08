/**
 * Third Person Action Game Preset
 *
 * A pre-configured setup for third-person action games with:
 * - Third-person camera with orbit controls
 * - Kinematic character controller (WASD + jump)
 * - Physics-based interactions
 * - Spatial audio
 * - Multiplayer networking
 */

import { GameContext } from "../core/GameTypes";
import { MainContext } from "../core/MainThread";

// Game thread modules
import { AudioModule } from "../core/audio/audio.game";
import { InputModule } from "../core/input/input.game";
import { PhysicsModule, PhysicsSystem } from "../core/physics/physics.game";
import { NetworkModule, NetworkExitWorldQueueSystem } from "../core/network/network.game";
import { StatsModule, GameWorkerStatsSystem } from "../core/stats/stats.game";
import { EditorModule, EditorStateSystem } from "../core/editor/editor.game";
import { RendererModule } from "../core/renderer/renderer.game";
import { PrefabModule, PrefabDisposalSystem } from "../core/prefab/prefab.game";
import {
  ResourceModule,
  ResourceLoaderSystem,
  ResourceDisposalSystem,
  RecycleResourcesSystem,
  ResourceTickSystem,
} from "../core/resource/resource.game";
import { PlayerModule } from "../core/player/Player.game";
import {
  KinematicCharacterControllerModule,
  KinematicCharacterControllerSystem,
} from "../core/player/KinematicCharacterController";
import { FlyCharacterControllerModule, FlyControllerSystem } from "../core/player/FlyCharacterController";
import { NametagModule, NametagSystem } from "../core/player/nametags.game";
// MatrixModule is optional - use for Matrix network integration
// import { MatrixModule } from "../../thirdroom/matrix/matrix.game";
import { WebSGNetworkModule } from "../core/network/scripting.game";
import { WebSGUIModule } from "../core/ui/ui.game";

// Game systems
import { UpdateRawInputSystem, ResetRawInputSystem } from "../core/input/RawInputSystems";
import { ActionMappingSystem } from "../core/input/ActionMappingSystem";
import { UpdateMatrixWorldSystem } from "../core/component/transform";
import { NetworkInterpolationSystem } from "../core/network/NetworkInterpolationSystem";
import { AnimationSystem } from "../core/animation/animation.game";
import { ScriptingSystem } from "../core/scripting/scripting.game";
import { RemoteCameraSystem } from "../core/camera/camera.game";
import { InboundNetworkSystem } from "../core/network/inbound.game";
import { OutboundNetworkSystem } from "../core/network/outbound.game";
import { GLTFResourceDisposalSystem } from "../core/gltf/gltf.game";
import { IncomingTripleBufferSystem } from "../core/resource/IncomingTripleBufferSystem";
import { OutgoingTripleBufferSystem } from "../core/resource/OutgoingTripleBufferSystem";
import { SkipRenderLerpSystem } from "../core/component/SkipRenderLerpSystem";
import { SetWebXRReferenceSpaceSystem, WebXRAvatarRigSystem } from "../core/input/WebXRAvatarRigSystem";
import { GameResourceSystem } from "../core/resource/GameResourceSystem";
import { EnableCharacterControllerSystem } from "../core/player/CharacterController";
import { CameraRigSystem } from "../core/player/CameraRig";

// Plugins
import { WorldLoaderModule, WorldLoaderSystem } from "../plugins/world-loader/world-loader.game";
import { InteractionModule, InteractionSystem, ResetInteractablesSystem } from "../plugins/interaction/interaction.game";
import { XRInteractionSystem } from "../plugins/interaction/XRInteractionSystem";
import { SpawnablesModule } from "../plugins/spawnables/spawnables.game";
import { ActionBarSystem } from "../plugins/world-loader/action-bar.game";

// Main thread modules
import { AudioModule as MainAudioModule } from "../core/audio/audio.main";
import { NetworkModule as MainNetworkModule } from "../core/network/network.main";
import { StatsModule as MainStatsModule } from "../core/stats/stats.main";
import { WorldLoaderModule as MainWorldLoaderModule } from "../plugins/world-loader/world-loader.main";
import { PlayerModule as MainPlayerModule } from "../core/player/Player.main";

/**
 * Configuration for a Manifold preset
 */
export interface ManifoldPreset {
  name: string;
  description: string;
  gameModules: unknown[];
  gameSystems: ((ctx: GameContext) => void)[];
  mainModules: unknown[];
  mainSystems: ((ctx: MainContext) => void)[];
}

/**
 * Third Person Action Game Preset
 *
 * Optimized for third-person action games with:
 * - Physics-based character movement
 * - Third-person camera with orbit capability
 * - Grab and interact with objects
 * - Multiplayer support
 */
export const ThirdPersonActionPreset: ManifoldPreset = {
  name: "Third Person Action",
  description: "A preset for third-person action games with physics, networking, and spatial audio.",

  gameModules: [
    PrefabModule,
    ResourceModule,
    InputModule,
    PhysicsModule,
    AudioModule,
    NetworkModule,
    StatsModule,
    EditorModule,
    RendererModule,
    WorldLoaderModule,
    // MatrixModule, // Optional - for Matrix network integration
    PlayerModule,
    KinematicCharacterControllerModule,
    FlyCharacterControllerModule,
    InteractionModule,
    SpawnablesModule,
    NametagModule,
    WebSGNetworkModule,
    WebSGUIModule,
  ],

  gameSystems: [
    IncomingTripleBufferSystem,

    UpdateRawInputSystem,

    WebXRAvatarRigSystem,
    ActionMappingSystem,

    InboundNetworkSystem,

    WorldLoaderSystem,

    CameraRigSystem,

    KinematicCharacterControllerSystem,
    FlyControllerSystem,
    SetWebXRReferenceSpaceSystem,
    InteractionSystem,
    XRInteractionSystem,
    ActionBarSystem,
    EnableCharacterControllerSystem,

    // Step physics forward and copy rigidbody data to transform component
    PhysicsSystem,

    // Interpolate towards authoritative state
    NetworkInterpolationSystem,

    ScriptingSystem,

    AnimationSystem,

    UpdateMatrixWorldSystem,

    NametagSystem,
    EditorStateSystem,

    OutboundNetworkSystem,
    NetworkExitWorldQueueSystem,

    RemoteCameraSystem,
    PrefabDisposalSystem,
    GLTFResourceDisposalSystem,

    ResetInteractablesSystem,
    ResetRawInputSystem,
    GameWorkerStatsSystem,

    GameResourceSystem, // Commit Resources to TripleBuffer
    ResourceTickSystem,
    OutgoingTripleBufferSystem, // Swap write triplebuffers
    RecycleResourcesSystem, // Drain entity recycle queues. Call removeEntity if released by other threads.
    ResourceDisposalSystem, // Drain entity disposal queues. Enqueue into shared ringbuffers.
    ResourceLoaderSystem, // Drain entity creation queue. postMessage to other threads.

    SkipRenderLerpSystem, // Change node.skipLerp after commit
  ],

  mainModules: [MainAudioModule, MainNetworkModule, MainStatsModule, MainWorldLoaderModule, MainPlayerModule],

  mainSystems: [],
};
