import { Express, Request, Response } from "express";

type SSEClient = {
  id: string;
  res: Response;
  clientId?: number;
  userId?: number;
};

const clients: Map<string, SSEClient> = new Map();
let nextId = 1;

export type NotificationType =
  | "friend_added"
  | "friend_unfollowed"
  | "message_received"
  | "auto_reply_sent"
  | "chatbot_response"
  | "step_delivered"
  | "webhook_error"
  | "rich_menu_synced";

export type Notification = {
  type: NotificationType;
  clientId: number;
  title: string;
  message: string;
  timestamp: string;
  data?: Record<string, unknown>;
};

// Send notification to all connected clients watching a specific clientId
export function broadcastNotification(notification: Notification) {
  const payload = `data: ${JSON.stringify(notification)}\n\n`;
  clients.forEach((client) => {
    if (!client.clientId || client.clientId === notification.clientId) {
      try {
        client.res.write(payload);
      } catch {
        clients.delete(client.id);
      }
    }
  });
}

// Register SSE routes
export function registerSSERoutes(app: Express) {
  app.get("/api/sse/notifications", (req: Request, res: Response) => {
    const clientId = req.query.clientId ? parseInt(req.query.clientId as string, 10) : undefined;

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    });

    const id = `sse_${nextId++}`;
    const sseClient: SSEClient = { id, res, clientId };
    clients.set(id, sseClient);

    // Send initial connection event
    res.write(`data: ${JSON.stringify({ type: "connected", message: "リアルタイム通知に接続しました" })}\n\n`);

    // Heartbeat every 30 seconds
    const heartbeat = setInterval(() => {
      try {
        res.write(": heartbeat\n\n");
      } catch {
        clearInterval(heartbeat);
        clients.delete(id);
      }
    }, 30000);

    req.on("close", () => {
      clearInterval(heartbeat);
      clients.delete(id);
    });
  });

  // Stats endpoint for connected clients
  app.get("/api/sse/stats", (_req: Request, res: Response) => {
    res.json({ connectedClients: clients.size });
  });
}
