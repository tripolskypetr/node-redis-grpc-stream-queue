import { WSContext } from "hono/ws";

import { grpc } from "@modules/remote-grpc";
import { ConnectionManager, redis } from "@modules/remote-redis";
import { singleshot } from "functools-kit";
import { app, upgradeWebSocket } from "src/config/app";

const connectionManager = new ConnectionManager("ws");

app.get("/api/v1/realtime/ws", upgradeWebSocket(() => {

  let isClosed = false;

  const makeConnection = singleshot((sessionId: string, ws: WSContext) => {
    connectionManager.listenEvent(sessionId, async (data) => {
      if (isClosed) {
        return false;
      }
      ws.send(JSON.stringify(data));
      return true;
    }, {
      queue: redis.hostWsWebConnection,
    });

    connectionManager.listenDisconnect(sessionId, () => {
      if (!isClosed) {
        ws.close();
      }
    });
  });

  return {
    onMessage(event, ws) {
      const { sessionId } = JSON.parse(event.data.toString());
      makeConnection(sessionId, ws);
    },
    onClose: () => {
      isClosed = true;
    },
  }
}));

grpc.streamService.makeClient<{ side: string, value: string }>("MessageService", async (message) => {
  connectionManager.emit(message.data);
}, {
  queue: redis.hostWsClientConnection,
});

export default app;
