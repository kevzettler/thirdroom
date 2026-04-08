import { addComponent } from "bitecs";

import { GameContext } from "../../core/GameTypes";
import { getModule } from "../../core/module/module.common";
import { PhysicsModule } from "../../core/physics/physics.game";
import { RemoteNode } from "../../core/resource/RemoteResources";
import { InteractableType } from "../../core/resource/schema";
import { addInteractableComponent } from "../interaction/interaction.game";
import { PortalProps } from "./portals.common";

export const PortalComponent = new Map<number, PortalProps>();

export const addPortalComponent = (ctx: GameContext, node: RemoteNode, data: PortalProps) => {
  const physics = getModule(ctx, PhysicsModule);
  addInteractableComponent(ctx, physics, node, InteractableType.Portal);
  addComponent(ctx.world, PortalComponent, node.eid);
  PortalComponent.set(node.eid, data);
  return node;
};
