import { Router, Response } from "express";
import {
  createWorld,
  findWorldById,
  findAllWorlds,
  updateWorld,
  deleteWorld,
} from "../models/World.js";
import { authenticateToken, AuthRequest } from "../middleware/auth.js";

const router = Router();

// Get all worlds
router.get("/", (req, res: Response) => {
  const worlds = findAllWorlds();
  res.json(worlds);
});

// Get world by ID
router.get("/:id", (req, res: Response) => {
  const world = findWorldById(req.params.id);
  if (!world) {
    return res.status(404).json({ error: "World not found" });
  }
  res.json(world);
});

// Create new world (requires auth)
router.post("/", authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const { name, sceneUrl, scenePreviewUrl, scriptUrl, maxMemberObjectCap } = req.body;

    if (!name || !sceneUrl) {
      return res.status(400).json({ error: "Name and sceneUrl are required" });
    }

    const world = createWorld({
      name,
      sceneUrl,
      scenePreviewUrl,
      scriptUrl,
      ownerId: req.userId!,
      maxMemberObjectCap,
    });

    res.status(201).json(world);
  } catch (error) {
    console.error("Create world error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update world (requires auth, owner only)
router.put("/:id", authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const world = findWorldById(req.params.id);
    if (!world) {
      return res.status(404).json({ error: "World not found" });
    }

    if (world.ownerId !== req.userId) {
      return res.status(403).json({ error: "Only the owner can update this world" });
    }

    const { name, sceneUrl, scenePreviewUrl, scriptUrl, maxMemberObjectCap } = req.body;
    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (sceneUrl !== undefined) updates.sceneUrl = sceneUrl;
    if (scenePreviewUrl !== undefined) updates.scenePreviewUrl = scenePreviewUrl;
    if (scriptUrl !== undefined) updates.scriptUrl = scriptUrl;
    if (maxMemberObjectCap !== undefined) updates.maxMemberObjectCap = maxMemberObjectCap;

    const updated = updateWorld(req.params.id, updates);
    if (!updated) {
      return res.status(500).json({ error: "Failed to update world" });
    }

    res.json(updated);
  } catch (error) {
    console.error("Update world error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete world (requires auth, owner only)
router.delete("/:id", authenticateToken, (req: AuthRequest, res: Response) => {
  const world = findWorldById(req.params.id);
  if (!world) {
    return res.status(404).json({ error: "World not found" });
  }

  if (world.ownerId !== req.userId) {
    return res.status(403).json({ error: "Only the owner can delete this world" });
  }

  const deleted = deleteWorld(req.params.id);
  if (!deleted) {
    return res.status(500).json({ error: "Failed to delete world" });
  }

  res.status(204).send();
});

export default router;

