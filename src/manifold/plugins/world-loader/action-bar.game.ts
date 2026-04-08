import { ourPlayerQuery } from "../../core/player/Player";
import { GameContext } from "../../core/GameTypes";
import { ActionMap, ActionDefinition, ActionType, BindingType, ButtonActionState } from "../../core/input/ActionMap";
import { GameInputModule, InputModule } from "../../core/input/input.game";
import { XRAvatarRig } from "../../core/input/WebXRAvatarRigSystem";
import { getModule, Thread } from "../../core/module/module.common";
import { getCamera } from "../../core/player/getCamera";
import { RemoteNode } from "../../core/resource/RemoteResources";
import { tryGetRemoteResource } from "../../core/resource/resource.game";
import { ScriptComponent, scriptQuery } from "../../core/scripting/scripting.game";
import { spawnPrefab } from "../spawnables/spawnables.game";
import { ActionBarItem, SetActionBarItemsMessage, ThirdRoomMessageType } from "./world-loader.common";
import { WorldLoaderModule } from "./world-loader.game";

export const actionBarMap: ActionMap = {
  id: "action-bar",
  actionDefs: [],
};

for (let i = 0; i < 10; i++) {
  const actionDef: ActionDefinition = {
    id: `action-bar-${i}`,
    path: `ActionBar/${i}`,
    type: ActionType.Button,
    bindings: [
      {
        type: BindingType.Button,
        path: `Keyboard/Digit${i}`,
      },
    ],
  };

  if (i === 1) {
    actionDef.bindings.push({
      type: BindingType.Button,
      path: `XRInputSource/primary/a-button`,
    });
  }

  actionBarMap.actionDefs.push(actionDef);
}

export const defaultActionBarItems: ActionBarItem[] = [
  {
    id: "small-crate",
    label: "Small Crate",
    thumbnail: "/image/small-crate-icon.png",
    spawnable: true,
  },
  {
    id: "medium-crate",
    label: "Medium Crate",
    thumbnail: "/image/medium-crate-icon.png",
    spawnable: true,
  },
  {
    id: "large-crate",
    label: "Large Crate",
    thumbnail: "/image/large-crate-icon.png",
    spawnable: true,
  },
  {
    id: "mirror-ball",
    label: "Mirror Ball",
    thumbnail: "/image/mirror-ball-icon.png",
    spawnable: true,
  },
  {
    id: "black-mirror-ball",
    label: "Black Mirror Ball",
    thumbnail: "/image/black-mirror-ball-icon.png",
    spawnable: true,
  },
  {
    id: "emissive-ball",
    label: "Emissive Ball",
    thumbnail: "/image/emissive-ball-icon.png",
    spawnable: true,
  },
];

export function setDefaultActionBarItems(ctx: GameContext) {
  const worldLoader = getModule(ctx, WorldLoaderModule);

  worldLoader.actionBarItems.length = 0;
  worldLoader.actionBarItems.push(...defaultActionBarItems);

  ctx.sendMessage<SetActionBarItemsMessage>(Thread.Main, {
    type: ThirdRoomMessageType.SetActionBarItems,
    actionBarItems: worldLoader.actionBarItems,
  });
}

export function ActionBarSystem(ctx: GameContext) {
  const input = getModule(ctx, InputModule);
  const { actionBarItems } = getModule(ctx, WorldLoaderModule);

  const scripts = scriptQuery(ctx.world);

  processPressedActionBarActions(actionBarItems, input, (actionBarItem) => {
    for (let i = 0; i < scripts.length; i++) {
      const script = ScriptComponent.get(scripts[i]);

      if (!script) {
        continue;
      }
      const actionBarListeners = script.wasmCtx.resourceManager.actionBarListeners;

      for (let l = 0; l < actionBarListeners.length; l++) {
        const listener = actionBarListeners[l];
        listener.actions.push(actionBarItem.id);
      }
    }
  });

  const eid = ourPlayerQuery(ctx.world)[0];

  if (eid) {
    const node = tryGetRemoteResource<RemoteNode>(ctx, eid);
    const xr = XRAvatarRig.get(eid);

    processPressedActionBarActions(actionBarItems, input, (actionBarItem) => {
      if (actionBarItem.spawnable !== true) {
        return;
      }

      if (xr && xr.rightRayEid) {
        const rightRayNode = tryGetRemoteResource<RemoteNode>(ctx, xr.rightRayEid);
        return spawnPrefab(ctx, rightRayNode, actionBarItem.id, true);
      } else {
        const camera = getCamera(ctx, node).parent;

        if (camera) {
          return spawnPrefab(ctx, camera, actionBarItem.id, true);
        }
      }
    });
  }
}

function processPressedActionBarActions(
  actionBarItems: ActionBarItem[],
  input: GameInputModule,
  callback: (item: ActionBarItem) => boolean | void
) {
  for (let i = 0; i < actionBarMap.actionDefs.length; i++) {
    const actionDef = actionBarMap.actionDefs[i];
    const action = input.actionStates.get(actionDef.path) as ButtonActionState | undefined;

    if (action?.pressed) {
      const itemIndex = i === 0 ? 9 : i - 1;
      const actionBarItem = actionBarItems[itemIndex];

      if (!actionBarItem) {
        continue;
      }

      // Early out if the callback returns false
      // spawnPrefab returns false if the prefab cannot be spawned due to object cap.
      if (callback(actionBarItem) === false) {
        return;
      }
    }
  }
}
