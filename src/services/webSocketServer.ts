import type { Server } from "node:http";
import { WebSocket, WebSocketServer } from "ws";
import { authenticateWebSocket } from "./webSocketAuth";

import { pool } from "../config/db";
import type { SubmissionNotification } from "./notificationService";

// One user can connect from several clients. Each connection has its own expiry.
const connections = new Map<number, Map<WebSocket, number>>();

export function setupWebSocketServer(server: Server) {
  const webSocketServer = new WebSocketServer({
    noServer: true,
    maxPayload: 16 * 1024
  });

  server.on("upgrade", (request, socket, head) => {
    const onSocketError = () => socket.destroy();
    socket.on("error", onSocketError);

    async function connect() {
      if (request.url !== "/ws") {
        socket.end("HTTP/1.1 404 Not Found\r\nConnection: close\r\n\r\n");
        return;
      }

      const user = await authenticateWebSocket(
        request.headers.authorization
      );

      if (!user || user.expiresAt <= Date.now()) {
        socket.end("HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n");
        return;
      }

      if (socket.destroyed) {
        return;
      }

      webSocketServer.handleUpgrade(request, socket, head, (ws) => {
        socket.removeListener("error", onSocketError);

        ws.on("error", () => {
          ws.terminate();
        });

        const userConnections = connections.get(user.userId) ?? new Map<WebSocket, number>();
        userConnections.set(ws, user.expiresAt);
        connections.set(user.userId, userConnections);

        const expiryTimer = setTimeout(() => {
          ws.close(1008, "Token expired. Log in again.");
        }, user.expiresAt - Date.now());

        ws.on("close", () => {
          clearTimeout(expiryTimer);
          userConnections.delete(ws);
          if (userConnections.size === 0) {
            connections.delete(user.userId);
          }
        });

        ws.send(JSON.stringify({
          type: "connected",
          userId: user.userId
        }));
      });
    }

    connect().catch(() => {
      if (!socket.destroyed) {
        socket.end(
          "HTTP/1.1 503 Service Unavailable\r\nConnection: close\r\n\r\n"
        );
      }
    });
  });

  return webSocketServer;
}

// Live delivery is best effort; the committed REST feed remains available.
export async function publishNotification(
  notification: SubmissionNotification | null
): Promise<void> {
  if (!notification) return;

  const userConnections = connections.get(notification.user_id);
  if (!userConnections || userConnections.size === 0) return;

  try {
    // Recheck the saved notification and current access before live delivery.
    const access = await pool.query(
      `SELECT n.id
       FROM notifications n
       JOIN users u ON u.id = n.user_id
       JOIN projects p ON p.id = n.project_id
       WHERE n.id = $1 AND n.user_id = $2
         AND (p.owner_id = $2 OR EXISTS (
           SELECT 1 FROM project_members pm
           WHERE pm.project_id = p.id AND pm.user_id = $2
         ))`,
      [notification.id, notification.user_id]
    );

    if (access.rows.length === 0) return;

    const message = JSON.stringify({
      type: "notification",
      notification
    });

    for (const [ws, expiresAt] of userConnections) {
      if (expiresAt <= Date.now()) {
        ws.close(1008, "Token expired. Log in again.");
        continue;
      }
      if (ws.readyState !== WebSocket.OPEN) continue;
      if (ws.bufferedAmount > 1024 * 1024) {
        ws.terminate();
        continue;
      }
      try {
        ws.send(message, (error) => {
          if (error) ws.terminate();
        });
      } catch {
        ws.terminate();
      }
    }
  } catch {
    // A live delivery failure must not turn a committed action into an API error.
    console.error("Live notification delivery failed; the notification remains in the activity feed");
  }
}
