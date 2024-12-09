import { singleton } from "di-singleton";
import { IPubsubWrappedFn, pubsub, Subject } from "functools-kit";

type MessageListener<Data extends WeakKey = any> = (data: Data) => Promise<boolean>;

export const ConnectionManager = singleton(
  class {
    _disconnectSubject = new Subject<string>();

    _listenerMap = new Map<string, IPubsubWrappedFn>();
    _emitMap = new Map<string, MessageListener>();

    constructor(readonly connectionPoolId: string) { }

    listenEvent = async <Data extends WeakKey = any>(
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

    emit = <Data extends WeakKey = any>(data: Data) => {
      for (const fn of this._listenerMap.values()) {
        fn(data);
      }
    };
  }
);

export type TConnectionManager = InstanceType<typeof ConnectionManager>;

export default ConnectionManager;
