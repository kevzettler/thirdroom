import { useAtomValue, useSetAtom } from "jotai";

import { useAuth } from "../../../hooks/useAuth";
import { overlayVisibilityAtom } from "../../../state/overlayVisibility";
import { worldAtom } from "../../../state/world";
import { Button } from "../../../atoms/button/Button";
import { Text } from "../../../atoms/text/Text";
import "./StatusBar.css";

export function SimpleStatusBar() {
  const { user } = useAuth();
  const { entered: isWorldEntered } = useAtomValue(worldAtom);
  const setOverlayVisibility = useSetAtom(overlayVisibilityAtom);

  const toggleOverlay = () => {
    setOverlayVisibility((prev) => !prev);
  };

  return (
    <div className="StatusBar" style={{ 
      position: "fixed", 
      bottom: "10px", 
      left: "50%", 
      transform: "translateX(-50%)",
      display: "flex",
      gap: "10px",
      alignItems: "center",
      backgroundColor: "rgba(0,0,0,0.7)",
      padding: "8px 16px",
      borderRadius: "8px"
    }}>
      <Text color="world" variant="b3">
        {user?.username || "User"}
      </Text>
      {isWorldEntered && (
        <Button size="sm" variant="secondary" onClick={toggleOverlay}>
          Menu (ESC)
        </Button>
      )}
    </div>
  );
}
