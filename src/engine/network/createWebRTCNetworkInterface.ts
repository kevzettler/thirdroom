import geckos from "@geckos.io/client";
import { Channel } from "@geckos.io/client";
import { exitWorld } from "../../plugins/thirdroom/thirdroom.main";
import { setLocalMediaStream } from "../audio/audio.main";
import { MainContext } from "../MainThread";
import { addPeer, disconnect, hasPeer, removePeer, setHost } from "./network.main";
import { SignalingClient } from "./signaling-client";

export interface WebRTCNetworkInterface {
  dispose: () => void;
  localPeerId: string;
}

// Re-export as NetworkInterface for compatibility
export type NetworkInterface = WebRTCNetworkInterface;

interface WorldPeer {
  peerId: string;
  userId?: string;
  channel?: Channel;
  dataChannel?: RTCDataChannel;
  mediaStream?: MediaStream;
}

export async function createWebRTCNetworkInterface(
  ctx: MainContext,
  userId: string,
  worldId: string,
  signalingUrl: string = "http://localhost:3001"
): Promise<WebRTCNetworkInterface> {
  const signalingClient = new SignalingClient(`${signalingUrl}/signaling`);
  const peers = new Map<string, WorldPeer>();
  let backendChannel: Channel | null = null;
  let localMediaStream: MediaStream | undefined;

  // Connect to signaling server
  const localPeerId = await signalingClient.connect();
  if (!localPeerId) {
    throw new Error("Failed to get peer ID from signaling server");
  }

  // Get user media for voice chat
  try {
    localMediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    setLocalMediaStream(ctx, localMediaStream);
  } catch (err) {
    console.warn("Failed to get user media:", err);
  }

  // Connect to backend peer server using geckos.io
  // Extract host and port from signaling URL - geckos.io wants them separately
  const urlObj = new URL(signalingUrl);
  const backendHost = urlObj.hostname;
  const backendPort = parseInt(urlObj.port) || 3001;
  backendChannel = geckos({ url: `${urlObj.protocol}//${backendHost}`, port: backendPort });

  backendChannel.onConnect((error) => {
    if (error) {
      console.error("Failed to connect to backend peer server:", error);
      return;
    }
    console.log("Connected to backend peer server");

    // Join world on backend
    backendChannel?.emit("join-world", { worldId, userId });

    // Backend peer is always available as host fallback
    setHost(ctx, "backend");
  });

  // Handle data from backend peer
  backendChannel.onRaw((data: ArrayBuffer) => {
    // Backend peer data can be used for authoritative game state
    // For now, we'll treat it like any other peer
    if (!hasPeer(ctx, "backend")) {
      // Create a virtual data channel for backend
      // In a real implementation, you might want to handle this differently
      console.log("Received data from backend peer");
    }
  });

  // Join world via signaling
  signalingClient.joinWorld(worldId, userId);

  // Handle peer list from signaling server
  signalingClient.on("peer-list", (message) => {
    if (message.peers) {
      message.peers.forEach((peer: { peerId: string; userId?: string }) => {
        if (peer.peerId !== localPeerId && !peers.has(peer.peerId)) {
          connectToPeer(peer.peerId, peer.userId);
        }
      });
    }
  });

  // Handle new peer joining
  signalingClient.on("peer-joined", (message) => {
    if (message.peerId && message.peerId !== localPeerId && !peers.has(message.peerId)) {
      connectToPeer(message.peerId, message.userId);
    }
  });

  // Handle peer leaving
  signalingClient.on("peer-left", (message) => {
    if (message.peerId) {
      const peer = peers.get(message.peerId);
      if (peer) {
        if (peer.dataChannel) {
          removePeer(ctx, message.peerId);
        }
        if (peer.channel) {
          peer.channel.close();
        }
        peers.delete(message.peerId);
      }
    }
  });

  // Store peer connections for reuse
  const peerConnections = new Map<string, RTCPeerConnection>();

  // Create RTCPeerConnection for P2P connections
  async function connectToPeer(remotePeerId: string, remoteUserId?: string, isOfferer: boolean = true) {
    // Don't reconnect if we already have this peer
    if (peerConnections.has(remotePeerId)) {
      return;
    }

    const peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
    peerConnections.set(remotePeerId, peerConnection);

    const peer: WorldPeer = {
      peerId: remotePeerId,
      userId: remoteUserId,
    };
    peers.set(remotePeerId, peer);

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        signalingClient.sendIceCandidate(remotePeerId, event.candidate.toJSON());
      }
    };

    // Handle incoming data channel (when we're not the offerer)
    peerConnection.ondatachannel = (event) => {
      const dataChannel = event.channel;
      peer.dataChannel = dataChannel;
      setupDataChannel(dataChannel, remotePeerId, peer);
    };

    // Handle remote stream for voice chat
    peerConnection.ontrack = (event) => {
      if (event.streams[0]) {
        peer.mediaStream = event.streams[0];
      }
    };

    // Add local audio tracks for voice chat
    if (localMediaStream) {
      localMediaStream.getAudioTracks().forEach((track) => {
        peerConnection.addTrack(track, localMediaStream!);
      });
    }

    // Use peer ID comparison to determine who should be the offerer (prevents glare)
    const shouldBeOfferer = isOfferer && localPeerId < remotePeerId;

    if (shouldBeOfferer) {
      // Create data channel (only offerer creates it)
      const dataChannel = peerConnection.createDataChannel("game", {
        ordered: true,
      });
      peer.dataChannel = dataChannel;
      setupDataChannel(dataChannel, remotePeerId, peer);

      // Create and send offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      signalingClient.sendOffer(remotePeerId, offer);
    }
  }

  function setupDataChannel(dataChannel: RTCDataChannel, remotePeerId: string, peer: WorldPeer) {
    dataChannel.binaryType = "arraybuffer";

    dataChannel.onopen = () => {
      console.log(`Data channel opened with peer ${remotePeerId}`);
      addPeer(ctx, remotePeerId, dataChannel);
    };

    dataChannel.onclose = () => {
      console.log(`Data channel closed with peer ${remotePeerId}`);
      removePeer(ctx, remotePeerId);
      peerConnections.delete(remotePeerId);
    };

    dataChannel.onerror = (error) => {
      console.error(`Data channel error with peer ${remotePeerId}:`, error);
    };
  }

  // Handle incoming ICE candidates (set up once, not per peer)
  signalingClient.on("ice-candidate", (message) => {
    if (message.from && message.data) {
      const peerConnection = peerConnections.get(message.from);
      if (peerConnection) {
        peerConnection.addIceCandidate(new RTCIceCandidate(message.data)).catch((err) => {
          console.error("Error adding ICE candidate:", err);
        });
      }
    }
  });

  // Handle incoming offer
  signalingClient.on("offer", async (message) => {
    if (message.from && message.data) {
      let peerConnection = peerConnections.get(message.from);
      
      // Create peer connection if it doesn't exist
      if (!peerConnection) {
        await connectToPeer(message.from, undefined, false);
        peerConnection = peerConnections.get(message.from);
      }

      if (peerConnection) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(message.data));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        signalingClient.sendAnswer(message.from, answer);
      }
    }
  });

  // Handle incoming answer
  signalingClient.on("answer", (message) => {
    if (message.from && message.data) {
      const peerConnection = peerConnections.get(message.from);
      if (peerConnection) {
        peerConnection.setRemoteDescription(new RTCSessionDescription(message.data)).catch((err) => {
          console.error("Error setting remote description:", err);
        });
      }
    }
  });

  // Simple host election: first peer to join becomes host, or backend if no peers
  setTimeout(() => {
    if (peers.size === 0) {
      setHost(ctx, localPeerId);
    } else {
      // Use first peer as host, or backend
      const firstPeer = Array.from(peers.values())[0];
      setHost(ctx, firstPeer.peerId || "backend");
    }
  }, 1000);

  return {
    localPeerId,
    dispose: () => {
      disconnect(ctx);
      exitWorld(ctx);
      setLocalMediaStream(ctx, undefined);

      // Close all peer connections
      peerConnections.forEach((pc, peerId) => {
        pc.close();
      });
      peerConnections.clear();

      peers.forEach((peer) => {
        if (peer.dataChannel) {
          peer.dataChannel.close();
        }
        if (peer.channel) {
          peer.channel.close();
        }
      });
      peers.clear();

      // Close backend connection
      if (backendChannel) {
        backendChannel.close();
        backendChannel = null;
      }

      // Close signaling connection
      signalingClient.disconnect();

      // Stop local media stream
      if (localMediaStream) {
        localMediaStream.getTracks().forEach((track) => track.stop());
        localMediaStream = undefined;
      }
    },
  };
}

// Compatibility exports
export type MatrixNetworkInterface = WebRTCNetworkInterface;
export const createMatrixNetworkInterface = createWebRTCNetworkInterface;

let baseNetworkInterface: NetworkInterface | undefined;
export const registerMatrixNetworkInterface = (networkInterface: NetworkInterface) => {
  baseNetworkInterface = networkInterface;
};
export const registerWebRTCNetworkInterface = registerMatrixNetworkInterface;

export const provideMatrixNetworkInterface = (
  update: (networkInterface: NetworkInterface | undefined) => void
) => {
  update(baseNetworkInterface);
};
export const provideWebRTCNetworkInterface = provideMatrixNetworkInterface;

