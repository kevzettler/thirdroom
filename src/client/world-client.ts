import config from "../../config.json";
import { authClient } from "./auth-client";

export interface World {
  id: string;
  name: string;
  sceneUrl: string;
  scenePreviewUrl?: string;
  scriptUrl?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  maxMemberObjectCap?: number;
}

export interface CreateWorldRequest {
  name: string;
  sceneUrl: string;
  scenePreviewUrl?: string;
  scriptUrl?: string;
  maxMemberObjectCap?: number;
}

export interface UpdateWorldRequest {
  name?: string;
  sceneUrl?: string;
  scenePreviewUrl?: string;
  scriptUrl?: string;
  maxMemberObjectCap?: number;
}

const BACKEND_URL = config.backendUrl || "http://localhost:3001";

export class WorldClient {
  private getAuthHeaders(): HeadersInit {
    const token = authClient.getToken();
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  }

  async getAllWorlds(): Promise<World[]> {
    const response = await fetch(`${BACKEND_URL}/api/worlds`, {
      method: "GET",
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch worlds");
    }

    return response.json();
  }

  async getWorldById(id: string): Promise<World> {
    const response = await fetch(`${BACKEND_URL}/api/worlds/${id}`, {
      method: "GET",
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("World not found");
      }
      throw new Error("Failed to fetch world");
    }

    return response.json();
  }

  async createWorld(data: CreateWorldRequest): Promise<World> {
    const response = await fetch(`${BACKEND_URL}/api/worlds`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Failed to create world" }));
      throw new Error(error.error || "Failed to create world");
    }

    return response.json();
  }

  async updateWorld(id: string, data: UpdateWorldRequest): Promise<World> {
    const response = await fetch(`${BACKEND_URL}/api/worlds/${id}`, {
      method: "PUT",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Failed to update world" }));
      throw new Error(error.error || "Failed to update world");
    }

    return response.json();
  }

  async deleteWorld(id: string): Promise<void> {
    const response = await fetch(`${BACKEND_URL}/api/worlds/${id}`, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Failed to delete world" }));
      throw new Error(error.error || "Failed to delete world");
    }
  }

  // Convert world to content format (for compatibility with existing code)
  worldToContent(world: World): {
    scene_url: string;
    scene_preview_url?: string;
    script_url?: string;
    max_member_object_cap?: number;
  } {
    return {
      scene_url: world.sceneUrl,
      scene_preview_url: world.scenePreviewUrl,
      script_url: world.scriptUrl,
      max_member_object_cap: world.maxMemberObjectCap,
    };
  }
}

export const worldClient = new WorldClient();

