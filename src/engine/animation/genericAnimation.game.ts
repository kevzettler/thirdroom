import { addComponent, defineQuery, enterQuery, IWorld, removeComponent } from "bitecs";
import { AnimationAction, AnimationClip, AnimationMixer, Bone, LoopRepeat } from "three";

import { Transform } from "../component/transform";
import { GameState } from "../GameTypes";
import { MechAnimationStates } from "./mechAnimation.game";

export interface IAnimationActionMap {
  [key: string]: AnimationAction;
}
export interface IAnimationComponent {
  mixer: AnimationMixer;
  clips: AnimationClip[];
  actions: IAnimationActionMap;
  animationController?: IGenericAnimationStateMachineIndex<MechAnimationStates>;
}

export interface IGenericAnimationStateMachineIndex<AnimationStateEnum> {
  possibleStates: { [K in keyof AnimationStateEnum]: string }
  [key: number]: string
}

export const GenericAnimationComponent = new Map<number, IAnimationComponent>();
export const BoneComponent = new Map<number, Bone>();

export const animationQuery = defineQuery([GenericAnimationComponent]);
const enterAnimationQuery = enterQuery(animationQuery);
const boneQuery = defineQuery([BoneComponent]);

export function GenericAnimationSystem(ctx: GameState) {
  initializeAnimations(ctx);
  processAnimations(ctx);
  syncBones(ctx);
}

function initializeAnimations(ctx: GameState) {
  const entered = enterAnimationQuery(ctx.world);
  for (let i = 0; i < entered.length; i++) {
    const eid = entered[i];
    const animation = GenericAnimationComponent.get(eid);

    if (animation) {
      animation.actions = animation.clips.reduce((obj, clip) => {
        const action = animation.mixer.clipAction(clip).play();
        action.enabled = false;
        obj[clip.name as keyof IAnimationActionMap] = action;
        return obj;
      }, {} as IAnimationActionMap);
    }
  }
  return ctx;
}

function processAnimations(ctx: GameState) {
  const ents = animationQuery(ctx.world);
  for (let i = 0; i < ents.length; i++) {
    const eid = ents[i];
    // animation component exists on the inner avatar entity
    const animationComponent = GenericAnimationComponent.get(eid);

    if (animationComponent && animationComponent.animationController) {
      const clipName = animationComponent.animationController[eid];
      const animation = animationComponent.actions[clipName];
      if (animation) {
        animation.setLoop(LoopRepeat, Infinity);
        animation.enabled = true;
        animation.play();
      }
    }

    if (animationComponent) {
      animationComponent.mixer.update(ctx.dt);
    }
  }
  return ctx;
}

function syncBones(ctx: GameState) {
  // sync bone positions
  const bones = boneQuery(ctx.world);
  for (let i = 0; i < bones.length; i++) {
    const eid = bones[i];
    const bone = BoneComponent.get(eid);
    if (bone) {
      const p = Transform.position[eid];
      const q = Transform.quaternion[eid];
      bone.position.toArray(p);
      bone.quaternion.toArray(q);
    }
  }
  return ctx;
}

export function addGenericAnimationComponent(world: IWorld, eid: number, props: IAnimationComponent) {
  addComponent(world, GenericAnimationComponent, eid);
  GenericAnimationComponent.set(eid, props);
}

export function removeGenericAnimationComponent(world: IWorld, eid: number) {
  removeComponent(world, GenericAnimationComponent, eid);
  GenericAnimationComponent.delete(eid);
}
