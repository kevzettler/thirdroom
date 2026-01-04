import { useState, useEffect } from "react";
import { worldClient, World } from "../../client/world-client";

export function useWorlds(): { worlds: World[]; loading: boolean; error: string | null; refetch: () => Promise<void> } {
  const [worlds, setWorlds] = useState<World[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorlds = async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedWorlds = await worldClient.getAllWorlds();
      setWorlds(fetchedWorlds);
    } catch (err: any) {
      setError(err.message || "Failed to load worlds");
      console.error("Failed to load worlds:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorlds();
  }, []);

  return {
    worlds,
    loading,
    error,
    refetch: fetchWorlds,
  };
}

