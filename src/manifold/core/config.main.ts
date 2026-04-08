/**
 * Default Main Thread Configuration
 *
 * This is the default configuration for the Manifold main thread.
 * For custom configurations, use the preset system instead.
 */

import { defineConfig } from "./module/module.common";
import { AudioModule, MainThreadAudioSystem } from "./audio/audio.main";
import { EditorModule, MainThreadEditorSystem } from "./editor/editor.main";
import { InputModule } from "./input/input.main";
import { MainThreadNetworkSystem, NetworkModule } from "./network/network.main";
import { StatsModule } from "./stats/stats.main";
import { MainContext } from "./MainThread";
import { RendererModule } from "./renderer/renderer.main";
import { ResourceModule, ResourceLoaderSystem, ReturnRecycledResourcesSystem } from "./resource/resource.main";
import { WorldLoaderModule } from "../plugins/world-loader/world-loader.main";
import {
  IncomingMainThreadTripleBufferSystem,
  OutgoingMainThreadTripleBufferSystem,
} from "./MainThreadTripleBufferSystems";
import { PlayerModule } from "./player/Player.main";

export default defineConfig<MainContext>({
  modules: [
    ResourceModule,
    EditorModule,
    AudioModule,
    NetworkModule,
    InputModule,
    StatsModule,
    RendererModule,
    WorldLoaderModule,
    PlayerModule,
  ],
  systems: [
    IncomingMainThreadTripleBufferSystem,
    ResourceLoaderSystem,
    MainThreadAudioSystem,
    MainThreadNetworkSystem,
    MainThreadEditorSystem,
    OutgoingMainThreadTripleBufferSystem,
    ReturnRecycledResourcesSystem,
  ],
});
