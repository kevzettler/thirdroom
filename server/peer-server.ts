import geckos, { ServerChannel } from "@geckos.io/server";
import { Server as HTTPServer } from "http";

interface PeerConnection {
  channel: ServerChannel;
  userId?: string;
  worldId?: string;
}

const peerConnections = new Map<string, PeerConnection>();
const worldPeers = new Map<string, Set<string>>(); // worldId -> Set of peer IDs

export function setupPeerServer(server: HTTPServer) {
  const io = geckos({
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.addServer(server);

  io.onConnection((channel: ServerChannel) => {
    const peerId = channel.id;
    console.log(`New peer connection: ${peerId}`);

    peerConnections.set(peerId, { channel });

    channel.on("join-world", (data: { worldId: string; userId: string }) => {
      if (!data.worldId || !data.userId) return;

      const connection = peerConnections.get(peerId);
      if (!connection) return;

      connection.worldId = data.worldId;
      connection.userId = data.userId;

      // Add to world peers
      if (!worldPeers.has(data.worldId)) {
        worldPeers.set(data.worldId, new Set());
      }
      worldPeers.get(data.worldId)!.add(peerId);

      // Send list of peers in this world
      const peers = Array.from(worldPeers.get(data.worldId)!).filter((id) => id !== peerId);
      channel.emit("peer-list", {
        worldId: data.worldId,
        peers: peers.map((id) => {
          const conn = peerConnections.get(id);
          return {
            peerId: id,
            userId: conn?.userId,
          };
        }),
      });

      // Notify other peers about new peer
      peers.forEach((otherPeerId) => {
        const otherConnection = peerConnections.get(otherPeerId);
        if (otherConnection) {
          otherConnection.channel.emit("peer-joined", {
            worldId: data.worldId,
            peerId,
            userId: data.userId,
          });
        }
      });
    });

    channel.on("disconnect", () => {
      handlePeerDisconnect(peerId);
    });

    // Handle raw data channel messages (for game networking)
    channel.onRaw((data: ArrayBuffer) => {
      const connection = peerConnections.get(peerId);
      if (!connection || !connection.worldId) return;

      // Broadcast to all other peers in the same world
      const worldPeerIds = worldPeers.get(connection.worldId);
      if (worldPeerIds) {
        worldPeerIds.forEach((otherPeerId) => {
          if (otherPeerId !== peerId) {
            const otherConnection = peerConnections.get(otherPeerId);
            if (otherConnection) {
              otherConnection.channel.raw.emit(data);
            }
          }
        });
      }
    });
  });

  console.log("Peer server ready on geckos.io");
}

function handlePeerDisconnect(peerId: string) {
  const connection = peerConnections.get(peerId);
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
      const otherConnection = peerConnections.get(otherPeerId);
      if (otherConnection) {
        otherConnection.channel.emit("peer-left", {
          worldId,
          peerId,
        });
      }
    });
  }

  peerConnections.delete(peerId);
  console.log(`Peer disconnected: ${peerId}`);
}

