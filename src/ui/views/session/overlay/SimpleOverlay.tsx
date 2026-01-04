import { useAtomValue, useSetAtom } from "jotai";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import "./Overlay.css";
import { useAuth } from "../../../hooks/useAuth";
import { worldClient, World } from "../../../../client/world-client";
import { worldAtom } from "../../../state/world";
import { overlayVisibilityAtom } from "../../../state/overlayVisibility";
import { Text } from "../../../atoms/text/Text";
import { Button } from "../../../atoms/button/Button";

// Simple world selector for backend-auth mode (no Matrix)
function WorldList() {
  const [worlds, setWorlds] = useState<World[]>([]);
  const [loading, setLoading] = useState(true);
  const [entering, setEntering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setOverlayVisibility = useSetAtom(overlayVisibilityAtom);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWorlds = async () => {
      try {
        const fetchedWorlds = await worldClient.getAllWorlds();
        setWorlds(fetchedWorlds);
      } catch (err: any) {
        setError(err.message || "Failed to fetch worlds");
      } finally {
        setLoading(false);
      }
    };
    fetchWorlds();
  }, []);

  const handleEnterWorld = async (world: World) => {
    console.log("Entering world:", world);
    setEntering(true);
    setError(null);
    try {
      // Navigate to world route - this will trigger WorldRootView which handles loading
      navigate(`/world/${world.id}`);
      setOverlayVisibility(false);
    } catch (err: any) {
      console.error("Failed to enter world:", err);
      setError(err.message || "Failed to enter world");
      setEntering(false);
    }
  };

  if (loading) {
    return (
      <div className="SimpleOverlay__content">
        <Text>Loading worlds...</Text>
      </div>
    );
  }

  if (error) {
    return (
      <div className="SimpleOverlay__content">
        <Text color="danger">{error}</Text>
        <Button onClick={() => setError(null)}>Try Again</Button>
      </div>
    );
  }

  if (entering) {
    return (
      <div className="SimpleOverlay__content">
        <Text>Loading world...</Text>
      </div>
    );
  }

  return (
    <div className="SimpleOverlay__content">
      <Text variant="h2" weight="bold">
        Available Worlds
      </Text>
      {worlds.length === 0 ? (
        <Text>No worlds available. Create one to get started!</Text>
      ) : (
        <div className="SimpleOverlay__worldList">
          {worlds.map((world) => (
            <div key={world.id} className="SimpleOverlay__worldCard">
              <Text variant="s1" weight="bold">
                {world.name}
              </Text>
              <Button onClick={() => handleEnterWorld(world)}>Enter World</Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function SimpleOverlay() {
  const { user, logout } = useAuth();
  const { entered: isWorldEntered } = useAtomValue(worldAtom);

  return (
    <div className="Overlay flex items-end" style={{ padding: "20px" }}>
      <div
        style={{
          backgroundColor: "rgba(0,0,0,0.8)",
          padding: "20px",
          borderRadius: "8px",
          width: "100%",
          maxWidth: "600px",
          margin: "0 auto",
          pointerEvents: "all",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <Text variant="h2" weight="bold" color="world">
            Welcome, {user?.username || "User"}
          </Text>
          <Button variant="secondary" size="sm" onClick={logout}>
            Logout
          </Button>
        </div>

        {isWorldEntered ? <Text>You are in a world. Press ESC to return to menu.</Text> : <WorldList />}
      </div>
    </div>
  );
}
