import { useLocation, useMatch } from "react-router-dom";

function useWorld(): [string | undefined, string | undefined, string | undefined] {
  const location = useLocation();

  const worldMatch = useMatch({ path: "world/:worldId/*" });
  const [alias, hashSearch] = location.hash.split("?");
  const reloadId = new URLSearchParams(location.search || hashSearch).get("reload") ?? undefined;

  const worldId = worldMatch?.params["worldId"] ?? undefined;
  return [worldId, alias.match(/^(#|!)\S+:\S+/) ? alias : undefined, reloadId];
}

export function useWorldPath(): [string | undefined, string | undefined] {
  const [worldId, , reloadId] = useWorld();

  // For now, just use worldId directly (no alias support yet)
  return [worldId, reloadId];
}

export function useUnknownWorldPath(): [string | undefined, string | undefined] {
  const [worldId] = useWorld();

  // Return worldId if present, alias support can be added later
  return [worldId, undefined];
}
