interface CrashGiantsModuleState {
  sceneGLTF?: GLTFResource;
  collisionsGLTF?: GLTFResource;
}


export const CrashGiantsModule = defineModule < GameState, CrashGiantsModuleState>

export function CrashGiantsSystem(ctx: GameState) {
  const input = getModule(ctx, InputModule);
  const toggleFlyMode = input.actions.get("toggleFlyMode") as ButtonActionState;
  const player = ownedPlayerQuery(ctx.world).at(-1);
  if (player && toggleFlyMode.pressed) {
    if (hasComponent(ctx.world, FlyPlayerRig, player)) {
      swapToPlayerRig(ctx, player);
    } else {
      swapToFlyPlayerRig(ctx, player);
    }
  }
}
