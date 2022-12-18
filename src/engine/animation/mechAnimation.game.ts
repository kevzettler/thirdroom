import RAPIER, { Capsule } from "@dimforge/rapier3d-compat";
import { addComponent, defineComponent, Types, defineQuery, enterQuery, getEntityComponents, hasComponent, IWorld, removeComponent } from "bitecs";
import { AnimationAction } from "three";

import { GameState } from "../GameTypes";
import { IAnimationActionMap, GenericAnimationComponent } from "./genericAnimation.game";

interface IMechAnimationMap extends IAnimationActionMap {
  Walk: AnimationAction;
  Dash: AnimationAction;
}

export enum AnimationClipType {
  Walk = "Walk",
  Dash = "Dash"
}

const MechStateMachine = { currentAction: Types.ui8 };
export const MechAnimationComponent = defineComponent(MechStateMachine);
export const mechAnimationQuery = defineQuery([GenericAnimationComponent, MechAnimationComponent]);
export const enterMechAnimationQuery = enterQuery(mechAnimationQuery);

export function MechAnimationSystem(ctx: GameState) {
  // on each system update
  // update the state machine to select animation clips
  // add animation clips to queue for blending by the generic animation system
  getClipActions(ctx);
}


function getClipActions(ctx: GameState) {
  const entered = enterMechAnimationQuery(ctx.world);
  if (entered.length) {
    const animationControls = GenericAnimationComponent.get(entered[0]);
    console.log("****************", animationControls);
    debugger;
  }

  const actions: AnimationAction[] = [];
  return actions;
}
