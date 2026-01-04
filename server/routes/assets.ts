import { Router, Request, Response } from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync } from "fs";
import { readFile } from "fs/promises";

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Serve assets from public/gltf directory
router.get("/:filename", async (req: Request, res: Response) => {
  try {
    const filename = req.params.filename;
    // Security: prevent directory traversal
    if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      return res.status(400).json({ error: "Invalid filename" });
    }

    // Path to public/gltf directory (relative to project root - server is in /server subfolder)
    const projectRoot = join(__dirname, "..", "..");
    const assetPath = join(projectRoot, "public", "gltf", filename);

    if (!existsSync(assetPath)) {
      return res.status(404).json({ error: "Asset not found" });
    }

    const fileBuffer = await readFile(assetPath);
    
    // Set appropriate content type based on file extension
    const ext = filename.split(".").pop()?.toLowerCase();
    const contentType = ext === "glb" || ext === "gltf" 
      ? "model/gltf-binary" 
      : ext === "png" 
      ? "image/png" 
      : ext === "jpg" || ext === "jpeg"
      ? "image/jpeg"
      : "application/octet-stream";

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Length", fileBuffer.length);
    res.send(fileBuffer);
  } catch (error) {
    console.error("Asset serving error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

