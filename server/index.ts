import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.js";
import worldRoutes from "./routes/worlds.js";
import assetRoutes from "./routes/assets.js";
import { setupSignaling } from "./signaling.js";
import { setupPeerServer } from "./peer-server.js";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/worlds", worldRoutes);
app.use("/api/assets", assetRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Start HTTP server
const server = app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});

// Setup WebRTC signaling server
setupSignaling(server);

// Setup geckos.io peer server
setupPeerServer(server);
