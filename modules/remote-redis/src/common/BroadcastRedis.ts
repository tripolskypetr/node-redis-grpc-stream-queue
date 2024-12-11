import { singleton } from "di-singleton";
import {
  IPubsubWrappedFn,
  pubsub,
  Subject,
  memoize,
  randomString,
  singleshot,
} from "functools-kit";
import BaseMap from "./BaseMap";
import { inject } from "src/core/di";
import RedisService from "src/services/base/RedisService";
import TYPES from "src/config/types";

type MessageListener<Data = any> = (data: Data) => Promise<boolean>;

type ConnectionEmit = keyof {
  "host-sse__redis-emit": never;
  "host-ws__redis-emit": never;
};

const TTL_ONLINE_SECONDS = 1 * 60;

export const BroadcastRedis = singleton(
  class {

    readonly redisService = inject<RedisService>(TYPES.redisService);

    _disconnectSubject = new Subject<string>();

    _listenerMap = new Map<string, IPubsubWrappedFn>();
    _emitMap = new Map<string, MessageListener>();

    getEmitQueue = memoize(
      ([id]) => id,
      (id: string) =>
        new (class extends BaseMap(`${this.connectionEmitId}__${id}`) {})()
    );

    constructor(readonly connectionEmitId: ConnectionEmit) {}

    listenEvent = async <Data = any>(
      id: string,
      emit: MessageListener<Data>
    ) => {
      const queue = this.getEmitQueue(id);
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
              onDestroy: async () => {
                this._listenerMap.delete(id);
                this._emitMap.delete(id);
                this._disconnectSubject.next(id);
                await queue.clear();
                this.getEmitQueue.clear(id);
              },
              queue: pubsub.fromMap(queue),
            }
          )
        );
    };

    listenDisconnect = (id: string, fn: () => void) => {
      this._disconnectSubject.filter((channelId) => channelId === id).once(fn);
    };

    _getTotalListeners = async () => {
      const redis = await this.redisService.getRedis();
      const pattern = `${this.connectionEmitId}__*`;
      const keys = await redis.keys(pattern);
      const orderKeys = keys.filter((key) => key.endsWith(":online"));
      const start = `${this.connectionEmitId}__`;
      const end = ':online';
      return [...new Set(orderKeys)].map((key) => key.slice(start.length, key.indexOf(end)));
    };

    _pushOnlineListener = async (id: string) => {
      const redis = await this.redisService.getRedis();
      await redis.setex(`${this.connectionEmitId}__${id}:online`, TTL_ONLINE_SECONDS, 'online');
    };

    emit = async <Data = any>(data: Data) => {
      for (const id of await this._getTotalListeners()) {
        if (this._listenerMap.has(id)) {
          continue;
        }
        const queue = this.getEmitQueue(id);
        await queue.setWithKeepExpire(randomString(), data);
      }
      for (const [id, fn] of this._listenerMap.entries()) {
        await this._pushOnlineListener(id);
        fn(data);
      }
    };
  }
);

export type TBroadcastRedis = InstanceType<typeof BroadcastRedis>;

export default BroadcastRedis;
