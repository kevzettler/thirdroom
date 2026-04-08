interface SignalingMessage {
  type: "offer" | "answer" | "ice-candidate" | "join-world" | "peer-list" | "peer-joined" | "peer-left" | "peer-id";
  from?: string;
  to?: string;
  worldId?: string;
  peerId?: string;
  userId?: string;
  peers?: Array<{ peerId: string; userId?: string }>;
  data?: any;
}

type SignalingMessageHandler = (message: SignalingMessage) => void;

export class SignalingClient {
  private ws: WebSocket | null = null;
  private peerId: string | null = null;
  private worldId: string | null = null;
  private userId: string | null = null;
  private handlers = new Map<string, SignalingMessageHandler[]>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(private signalingUrl: string) {}

  connect(): Promise<string> {
    return new Promise((resolve, reject) => {
      const wsUrl = this.signalingUrl.replace(/^http/, "ws");
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log("Signaling client connected");
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const message: SignalingMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error("Error parsing signaling message:", error);
        }
      };

      this.ws.onerror = (error) => {
        console.error("Signaling WebSocket error:", error);
        reject(error);
      };

      this.ws.onclose = () => {
        console.log("Signaling WebSocket closed");
        this.ws = null;
        this.peerId = null;
        this.attemptReconnect();
      };

      // Wait for peer-id message
      this.on("peer-id", (message) => {
        if (message.peerId) {
          this.peerId = message.peerId;
          resolve(message.peerId);
        }
      });
    });
  }

  private handleMessage(message: SignalingMessage) {
    const handlers = this.handlers.get(message.type);
    if (handlers) {
      handlers.forEach((handler) => handler(message));
    }
  }

  on(type: string, handler: SignalingMessageHandler) {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, []);
    }
    this.handlers.get(type)!.push(handler);
  }

  off(type: string, handler: SignalingMessageHandler) {
    const handlers = this.handlers.get(type);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  joinWorld(worldId: string, userId: string) {
    this.worldId = worldId;
    this.userId = userId;
    this.send({
      type: "join-world",
      worldId,
      userId,
    });
  }

  sendOffer(to: string, offer: RTCSessionDescriptionInit) {
    this.send({
      type: "offer",
      to,
      data: offer,
    });
  }

  sendAnswer(to: string, answer: RTCSessionDescriptionInit) {
    this.send({
      type: "answer",
      to,
      data: answer,
    });
  }

  sendIceCandidate(to: string, candidate: RTCIceCandidateInit) {
    this.send({
      type: "ice-candidate",
      to,
      data: candidate,
    });
  }

  private send(message: SignalingMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn("Cannot send signaling message: WebSocket not open");
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Attempting to reconnect to signaling server (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
        this.connect().catch((error) => {
          console.error("Reconnection failed:", error);
        });
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.handlers.clear();
    this.peerId = null;
    this.worldId = null;
    this.userId = null;
  }

  getPeerId(): string | null {
    return this.peerId;
  }
}

