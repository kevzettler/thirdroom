import { addComponent, defineQuery, enterQuery, IWorld, removeComponent } from "bitecs";
import { AnimationAction, AnimationClip, AnimationMixer, Bone, LoopRepeat } from "three";

import { Transform } from "../component/transform";
import { GameState } from "../GameTypes";
import { AnimationProps } from "../gltf/gltf.game";

interface GenericAnimationActionMap {
  [key: string]: AnimationAction;
}
export interface IAnimationComponent {
  mixer: AnimationMixer;
  clips: AnimationClip[];
  actions: GenericAnimationActionMap;
}

export const GruntAnimationComponent = new Map<number, IAnimationComponent>();
export const BoneComponent = new Map<number, Bone>();

const animationQuery = defineQuery([GruntAnimationComponent]);
const enterAnimationQuery = enterQuery(animationQuery);
const boneQuery = defineQuery([BoneComponent]);

export function GruntAnimationSystem(ctx: GameState) {
  initializeAnimations(ctx);
  processAnimations(ctx);
  syncBones(ctx);
}

function initializeAnimations(ctx: GameState) {
  const entered = enterAnimationQuery(ctx.world);
  for (let i = 0; i < entered.length; i++) {
    const eid = entered[i];
    const animation = GruntAnimationComponent.get(eid);

    if (animation) {
      animation.actions = animation.clips.reduce((obj, clip) => {
        const action = animation.mixer.clipAction(clip).play();
        action.enabled = false;
        obj[clip.name as keyof GenericAnimationActionMap] = action;
        return obj;
      }, {} as GenericAnimationActionMap);
    }
  }
  return ctx;
}

function processAnimations(ctx: GameState) {
  const ents = animationQuery(ctx.world);
  for (let i = 0; i < ents.length; i++) {
    const eid = ents[i];
    // animation component exists on the inner avatar entity
    const animation = GruntAnimationComponent.get(eid);

    const rigidBody = true;
    if (animation && rigidBody) {
      // collectively fade all animations out each frame
      const allActions: AnimationAction[] = Object.values(animation.actions);

      // synchronize selected clip action times
      //synchronizeClipActions(actionsToPlay);
      allActions[4].setLoop(LoopRepeat, Infinity);
      allActions[4].enabled = true;
      allActions[4].play();

      animation.mixer.update(ctx.dt);
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

export function addGruntAnimationComponent(world: IWorld, eid: number, props?: any) {
  addComponent(world, GruntAnimationComponent, eid);
  GruntAnimationComponent.set(eid, props);
}

export function removeGruntAnimationComponent(world: IWorld, eid: number) {
  removeComponent(world, GruntAnimationComponent, eid);
  GruntAnimationComponent.delete(eid);
}
