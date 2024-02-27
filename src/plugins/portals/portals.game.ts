import { addComponent } from "bitecs";

import { GameContext } from "../../engine/GameTypes";
import { RemoteNode } from "../../engine/resource/RemoteResources";
import { InteractableType } from "../../engine/resource/schema";
import { addInteractableComponent } from "../interaction/interaction.game";
import { PortalProps } from "./portals.common";

export const PortalComponent = new Map<number, PortalProps>();

export const addPortalComponent = (ctx: GameContext, node: RemoteNode, data: PortalProps) => {
  addInteractableComponent(ctx, node, InteractableType.Portal);
  addComponent(ctx.world, PortalComponent, node.eid);
  PortalComponent.set(node.eid, data);
  return node;
};
