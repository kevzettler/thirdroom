import { Server as HTTPServer } from "http";
import { WebSocketServer, WebSocket } from "ws";

interface SignalingMessage {
  type: "offer" | "answer" | "ice-candidate" | "join-world" | "peer-list";
  from?: string;
  to?: string;
  worldId?: string;
  data?: any;
}

interface PeerConnection {
  ws: WebSocket;
  userId?: string;
  worldId?: string;
}

const connections = new Map<string, PeerConnection>();
const worldPeers = new Map<string, Set<string>>(); // worldId -> Set of peer IDs

export function setupSignaling(server: HTTPServer) {
  const wss = new WebSocketServer({ server, path: "/signaling" });

  wss.on("connection", (ws: WebSocket, req) => {
    const peerId = `peer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    connections.set(peerId, { ws });

    console.log(`New signaling connection: ${peerId}`);

    ws.on("message", (data: Buffer) => {
      try {
        const message: SignalingMessage = JSON.parse(data.toString());

        switch (message.type) {
          case "join-world":
            handleJoinWorld(peerId, message);
            break;
          case "offer":
          case "answer":
          case "ice-candidate":
            handleSignalingMessage(peerId, message);
            break;
          default:
            console.warn(`Unknown message type: ${message.type}`);
        }
      } catch (error) {
        console.error("Error parsing signaling message:", error);
      }
    });

    ws.on("close", () => {
      handleDisconnect(peerId);
    });

    ws.on("error", (error) => {
      console.error(`WebSocket error for ${peerId}:`, error);
      handleDisconnect(peerId);
    });

    // Send peer ID to client
    ws.send(JSON.stringify({ type: "peer-id", peerId }));
  });

  console.log("Signaling server ready on /signaling");
}

function handleJoinWorld(peerId: string, message: SignalingMessage) {
  const connection = connections.get(peerId);
  if (!connection) return;

  const { worldId, userId } = message;
  if (!worldId) return;

  // Update connection info
  connection.worldId = worldId;
  connection.userId = userId;

  // Add to world peers
  if (!worldPeers.has(worldId)) {
    worldPeers.set(worldId, new Set());
  }
  worldPeers.get(worldId)!.add(peerId);

  // Send list of peers in this world
  const peers = Array.from(worldPeers.get(worldId)!).filter((id) => id !== peerId);
  connection.ws.send(
    JSON.stringify({
      type: "peer-list",
      worldId,
      peers: peers.map((id) => ({
        peerId: id,
        userId: connections.get(id)?.userId,
      })),
    })
  );

  // Notify other peers about new peer
  peers.forEach((otherPeerId) => {
    const otherConnection = connections.get(otherPeerId);
    if (otherConnection) {
      otherConnection.ws.send(
        JSON.stringify({
          type: "peer-joined",
          worldId,
          peerId,
          userId,
        })
      );
    }
  });
}

function handleSignalingMessage(fromPeerId: string, message: SignalingMessage) {
  const { to, type, data } = message;

  if (!to) {
    console.warn(`Signaling message missing 'to' field: ${type}`);
    return;
  }

  const targetConnection = connections.get(to);
  if (!targetConnection) {
    console.warn(`Target peer not found: ${to}`);
    return;
  }

  // Forward message to target peer
  targetConnection.ws.send(
    JSON.stringify({
      type,
      from: fromPeerId,
      data,
    })
  );
}

function handleDisconnect(peerId: string) {
  const connection = connections.get(peerId);
  if (!connection) return;

  const { worldId } = connection;

  // Remove from world peers
  if (worldId && worldPeers.has(worldId)) {
    worldPeers.get(worldId)!.delete(peerId);
    if (worldPeers.get(worldId)!.size === 0) {
      worldPeers.delete(worldId);
    }

    // Notify other peers about disconnect
    const remainingPeers = Array.from(worldPeers.get(worldId) || []);
    remainingPeers.forEach((otherPeerId) => {
      const otherConnection = connections.get(otherPeerId);
      if (otherConnection) {
        otherConnection.ws.send(
          JSON.stringify({
            type: "peer-left",
            worldId,
            peerId,
          })
        );
      }
    });
  }

  connections.delete(peerId);
  console.log(`Peer disconnected: ${peerId}`);
}

