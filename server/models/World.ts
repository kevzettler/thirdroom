export interface World {
  id: string;
  name: string;
  sceneUrl: string;
  scenePreviewUrl?: string;
  scriptUrl?: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  maxMemberObjectCap?: number;
}

// In-memory world store (replace with database in production)
export const worlds = new Map<string, World>();

// System user ID for seed worlds
const SYSTEM_USER_ID = "system";

// Default worlds to seed on startup
// Note: Only include GLB files that are complete world environments with:
// - A floor/ground plane
// - Spawn points (MX_spawn_point extension) 
// - Proper lighting and environment
const DEFAULT_WORLDS = [
  {
    id: "default_basketball_court",
    name: "Basketball Court",
    sceneUrl: "BasketballCourt.glb",
    scenePreviewUrl: "/image/BasketballPreview.png",
    ownerId: SYSTEM_USER_ID,
    maxMemberObjectCap: 100,
  },
  // Note: sci_fi_crate.glb is a prop model, not a world environment
  // It lacks floors, spawn points, and proper environment setup
];

// Seed default worlds on module load
function seedDefaultWorlds() {
  const now = new Date();
  for (const worldData of DEFAULT_WORLDS) {
    if (!worlds.has(worldData.id)) {
      const world: World = {
        ...worldData,
        createdAt: now,
        updatedAt: now,
      };
      worlds.set(world.id, world);
      console.log(`Seeded default world: ${world.name}`);
    }
  }
}

// Run seed on module initialization
seedDefaultWorlds();

export function createWorld(data: Omit<World, "id" | "createdAt" | "updatedAt">): World {
  const id = `world_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date();
  const world: World = {
    ...data,
    id,
    createdAt: now,
    updatedAt: now,
  };
  worlds.set(id, world);
  return world;
}

export function findWorldById(id: string): World | undefined {
  return worlds.get(id);
}

export function findAllWorlds(): World[] {
  return Array.from(worlds.values());
}

export function updateWorld(id: string, updates: Partial<Omit<World, "id" | "createdAt">>): World | undefined {
  const world = worlds.get(id);
  if (!world) return undefined;

  const updated: World = {
    ...world,
    ...updates,
    updatedAt: new Date(),
  };
  worlds.set(id, updated);
  return updated;
}

export function deleteWorld(id: string): boolean {
  return worlds.delete(id);
}

