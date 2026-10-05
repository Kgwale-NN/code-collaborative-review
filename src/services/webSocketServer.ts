import type { Server } from "node:http";
import { WebSocketServer } from "ws";
import { authenticateWebSocket } from "./webSocketAuth";

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

        const expiryTimer = setTimeout(() => {
          ws.close(1008, "Token expired. Log in again.");
        }, user.expiresAt - Date.now());

        ws.on("close", () => {
          clearTimeout(expiryTimer);
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
