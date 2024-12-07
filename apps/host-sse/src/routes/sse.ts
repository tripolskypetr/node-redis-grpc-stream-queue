import { Hono } from "hono";
import { stream } from "hono/streaming";

import { singleton } from "di-singleton";

import { pubsub, Subject, IPubsubWrappedFn } from "functools-kit";
import { grpc } from "@modules/remote-grpc";

const CONNECTION_SSE_RETRY = 5_000;

const app = new Hono();

type MessageListener<Data = any> = (data: Data) => Promise<boolean>;

const ConnectionManager = singleton(
  class {
    _disconnectSubject = new Subject<string>();

    _listenerMap = new Map<string, IPubsubWrappedFn>();
    _emitMap = new Map<string, MessageListener>();

    listenEvent = async <Data = any>(
      id: string,
      emit: MessageListener<Data>
    ) => {
      this._emitMap.set(id, emit);
      if (!this._listenerMap.has(id))
        this._listenerMap.set(
          id,
          pubsub<Data>(
            async (data) => {
              const emit = this._emitMap.get(id);
              if (emit) {
                return await emit(data);
              }
              return false;
            },
            {
              onDestroy: () => {
                this._listenerMap.delete(id);
                this._emitMap.delete(id);
                this._disconnectSubject.next(id);
              },
            }
          )
        );
    };

    listenDisconnect = (id: string, fn: () => void) => {
      this._disconnectSubject.filter((channelId) => channelId === id).once(fn);
    };

    emit = <Data = any>(data: Data) => {
      for (const fn of this._listenerMap.values()) {
        fn(data);
      }
    };
  }
);

const connectionManager = new ConnectionManager();

app.get("/:id", async (c) => {
  const connectionId = c.req.param("id");

  c.header('Content-Type', 'text/event-stream');
  c.header('Cache-Control', 'no-cache');
  c.header('Connection', 'keep-alive');

  return stream(c, async (stream) => {

    stream.write(`retry: ${CONNECTION_SSE_RETRY}\n\n`);

    connectionManager.listenEvent(connectionId, async (data) => {
      if (stream.aborted) {
        return false;
      }
      await stream.write(`data: ${JSON.stringify(data)}\n\n`)
      return true;
    });

    connectionManager.listenDisconnect(connectionId, () => {
      if (!stream.aborted) {
        stream.abort();
      }
    });

    return new Promise<void>((res) => stream.onAbort(() => res()));
  });
});

grpc.streamService.makeClient<{ side: string, value: string }>("MessageService", async (message) => {
  connectionManager.emit(message.data);
});

export default app;
