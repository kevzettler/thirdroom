import RAPIER, { Capsule } from "@dimforge/rapier3d-compat";
import { defineComponent, Types, defineQuery, enterQuery, hasComponent, addComponent, IWorld } from "bitecs";
import { AnimationAction, Vector3 } from "three";
import { vec3 } from "gl-matrix";

import { Networked, Owned } from "../network/network.game";
import { Transform } from "../component/transform";
import { GameState } from "../GameTypes";
import { GenericAnimationComponent, IGenericAnimationStateMachineIndex } from "./genericAnimation.game";
import { RigidBody } from "../physics/physics.game";


export enum MechAnimationStates {
  Walk = "Walk",
  Dash = "Dash",
  Idle = "Idle"
}


type MechAnimationStateMachineIndex = IGenericAnimationStateMachineIndex<typeof MechAnimationStates>;

export const MechAnimationComponent: MechAnimationStateMachineIndex = {
  possibleStates: MechAnimationStates
};

export const mechAnimationQuery = defineQuery([GenericAnimationComponent, MechAnimationComponent]);
export const enterMechAnimationQuery = enterQuery(mechAnimationQuery);


const _vel = vec3.create();
const walkThreshold = 10;

export function MechAnimationSystem(ctx: GameState) {
  // on each system update
  // update the state machine to select animation clips
  // add animation clips to queue for blending by the generic animation system
  updateAnimationState(ctx);
}


function updateAnimationState(ctx: GameState): void {
  const ents = mechAnimationQuery(ctx.world);
  if (ents.length) {
    for (let i = 0; i < ents.length; i++) {
      const eid = ents[i];
      const animationControls = GenericAnimationComponent.get(eid);

      if (animationControls) {
        const parent = Transform.parent[eid];
        if (!parent) {
          console.warn("updateAnimationState, missing parent Transform on AnimationComponent");
        }

        const rigidBody = RigidBody.store.get(parent);
        if (!rigidBody) {
          console.warn("missing rigid body??********");
        } else {
          const remote = hasComponent(ctx.world, Networked, eid) && !hasComponent(ctx.world, Owned, eid);
          const linvel = remote ? new Vector3().fromArray(Networked.velocity[eid]) : rigidBody.linvel();
          const vel = remote ? vec3.copy(_vel, Networked.velocity[eid]) : vec3.set(_vel, linvel.x, linvel.y, linvel.z);
          const totalSpeed = linvel.x ** 2 + linvel.z ** 2;
          if (totalSpeed > walkThreshold) {
            MechAnimationComponent[eid] = MechAnimationStates.Walk;
          } else {
            MechAnimationComponent[eid] = MechAnimationStates.Idle;
          }
        }
      }
    }
  }
}

export function addMechaAnimationComponent(world: IWorld, eid: number) {
  addComponent(world, MechAnimationComponent, eid);
  MechAnimationComponent[eid] = "Walk";
}
