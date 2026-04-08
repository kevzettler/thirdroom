import { MainContext } from "../../core/MainThread";
import { defineModule, getModule, registerMessageHandler, Thread } from "../../core/module/module.common";
import { NetworkModule } from "../../core/network/network.main";
import { printRenderThreadState, togglePhysicsDebug } from "../../core/renderer/renderer.main";
import { createDisposables } from "../../core/utils/createDisposables";
import { createDeferred } from "../../core/utils/Deferred";
import { registerThirdroomGlobalFn } from "../../core/utils/registerThirdroomGlobal";
import {
  WorldLoadedMessage,
  WorldLoadErrorMessage,
  LoadWorldMessage,
  PrintThreadStateMessage,
  ThirdRoomMessageType,
  PrintResourcesMessage,
  EnteredWorldMessage,
  EnterWorldErrorMessage,
  EnterWorldMessage,
  FindResourceRetainersMessage,
  SetActionBarItemsMessage,
  ActionBarItem,
  LoadWorldOptions,
  ReloadWorldMessage,
  ReloadWorldErrorMessage,
  ReloadedWorldMessage,
} from "./world-loader.common";

interface WorldLoaderModuleState {
  messageId: number;
  environmentUrl?: string;
  actionBarItems: ActionBarItem[];
}

export const WorldLoaderModule = defineModule<MainContext, WorldLoaderModuleState>({
  name: "world-loader",
  create() {
    return {
      messageId: 0,
      actionBarItems: [],
    };
  },
  init(ctx) {
    registerThirdroomGlobalFn("printThreadState", () => {
      ctx.sendMessage<PrintThreadStateMessage>(Thread.Game, {
        type: ThirdRoomMessageType.PrintThreadState,
      });

      printRenderThreadState(ctx);

      console.log(Thread.Main, ctx);
    });

    registerThirdroomGlobalFn("printResources", () => {
      ctx.sendMessage<PrintResourcesMessage>(Thread.Game, {
        type: ThirdRoomMessageType.PrintResources,
      });
    });

    registerThirdroomGlobalFn("findResourceRetainers", (resourceId) => {
      ctx.sendMessage<FindResourceRetainersMessage>(Thread.Game, {
        type: ThirdRoomMessageType.FindResourceRetainers,
        resourceId,
      });
    });

    registerThirdroomGlobalFn("togglePhysicsDebug", () => {
      togglePhysicsDebug(ctx);
    });

    return createDisposables([
      registerMessageHandler(ctx, ThirdRoomMessageType.SetActionBarItems, onSetActionBarItems),
    ]);
  },
});

// Backward compatibility alias
export const ThirdroomModule = WorldLoaderModule;

export async function loadWorld(ctx: MainContext, environmentUrl: string, options: LoadWorldOptions) {
  const worldLoader = getModule(ctx, WorldLoaderModule);
  const loadingEnvironment = createDeferred(false);

  const id = worldLoader.messageId++;

  // eslint-disable-next-line prefer-const
  let disposeHandlers: () => void;

  const onLoadWorld = (ctx: MainContext, message: WorldLoadedMessage) => {
    if (message.id === id) {
      if (message.url === worldLoader.environmentUrl) {
        loadingEnvironment.resolve(undefined);
      } else {
        loadingEnvironment.reject(new Error("Environment changed before it was finished loading."));
      }

      disposeHandlers();
    }
  };

  const onLoadWorldError = (ctx: MainContext, message: WorldLoadErrorMessage) => {
    console.log(`error`, message);
    if (message.id === id) {
      loadingEnvironment.reject(new Error(message.error));
      disposeHandlers();
    }
  };

  disposeHandlers = createDisposables([
    registerMessageHandler(ctx, ThirdRoomMessageType.WorldLoaded, onLoadWorld),
    registerMessageHandler(ctx, ThirdRoomMessageType.WorldLoadError, onLoadWorldError),
  ]);

  worldLoader.environmentUrl = environmentUrl;

  ctx.sendMessage<LoadWorldMessage>(Thread.Game, {
    type: ThirdRoomMessageType.LoadWorld,
    id,
    environmentUrl,
    options,
  });

  return loadingEnvironment.promise;
}

export function enterWorld(ctx: MainContext, localPeerId: string) {
  const worldLoader = getModule(ctx, WorldLoaderModule);
  const network = getModule(ctx, NetworkModule);
  const enteringWorld = createDeferred(false);

  const id = worldLoader.messageId++;

  // eslint-disable-next-line prefer-const
  let disposeHandlers: () => void;

  const onEnteredWorld = (ctx: MainContext, message: EnteredWorldMessage) => {
    if (message.id === id) {
      enteringWorld.resolve(undefined);
      disposeHandlers();
    }
  };

  const onEnterWorldError = (ctx: MainContext, message: EnterWorldErrorMessage) => {
    console.log(`error`, message);
    if (message.id === id) {
      enteringWorld.reject(new Error(message.error));
      disposeHandlers();
    }
  };

  disposeHandlers = createDisposables([
    registerMessageHandler(ctx, ThirdRoomMessageType.EnteredWorld, onEnteredWorld),
    registerMessageHandler(ctx, ThirdRoomMessageType.EnterWorldError, onEnterWorldError),
  ]);

  network.peerId = localPeerId;

  ctx.sendMessage<EnterWorldMessage>(Thread.Game, {
    type: ThirdRoomMessageType.EnterWorld,
    id,
    localPeerId,
  });

  return enteringWorld.promise;
}

export function reloadWorld(ctx: MainContext, environmentUrl: string, options: LoadWorldOptions) {
  const worldLoader = getModule(ctx, WorldLoaderModule);
  const reloadingWorld = createDeferred(false);

  const id = worldLoader.messageId++;

  // eslint-disable-next-line prefer-const
  let disposeHandlers: () => void;

  const onReloadedWorld = (ctx: MainContext, message: ReloadedWorldMessage) => {
    if (message.id === id) {
      reloadingWorld.resolve(undefined);
      disposeHandlers();
    }
  };

  const onReloadWorldError = (ctx: MainContext, message: ReloadWorldErrorMessage) => {
    console.log(`error`, message);
    if (message.id === id) {
      reloadingWorld.reject(new Error(message.error));
      disposeHandlers();
    }
  };

  disposeHandlers = createDisposables([
    registerMessageHandler(ctx, ThirdRoomMessageType.ReloadedWorld, onReloadedWorld),
    registerMessageHandler(ctx, ThirdRoomMessageType.ReloadWorldError, onReloadWorldError),
  ]);

  ctx.sendMessage<ReloadWorldMessage>(Thread.Game, {
    type: ThirdRoomMessageType.ReloadWorld,
    id,
    environmentUrl,
    options,
  });

  return reloadingWorld.promise;
}

export function exitWorld(context: MainContext) {
  context.sendMessage(Thread.Game, {
    type: ThirdRoomMessageType.ExitWorld,
  });
}

function onSetActionBarItems(ctx: MainContext, message: SetActionBarItemsMessage) {
  const worldLoader = getModule(ctx, WorldLoaderModule);
  worldLoader.actionBarItems = message.actionBarItems;
}
