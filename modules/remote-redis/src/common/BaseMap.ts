import { factory } from "di-factory";
import TYPES from "src/config/types";
import { inject } from "src/core/di";
import LoggerService from "src/services/base/LoggerService";
import RedisService from "src/services/base/RedisService";

const ITERATOR_BATCH_SIZE = 100;
const TTL_EXPIRE_SECONDS = 5 * 60;

export const BaseMap = factory(
  class {
    readonly redisService = inject<RedisService>(TYPES.redisService);
    readonly loggerService = inject<LoggerService>(TYPES.loggerService);

    constructor(readonly connectionKey: string) {}

    async setWithKeepExpire(key: string, value: any): Promise<void> {
      this.loggerService.debug(
        `BaseMap setWithKeepExpire key=${key} connection=${this.connectionKey}`,
        { key, value }
      );
      const redis = await this.redisService.getRedis();
      const mapTtl = await redis.pttl(`${this.connectionKey}:map`);
      await redis.hset(`${this.connectionKey}:map`, key, JSON.stringify(value));
      await redis.pexpire(`${this.connectionKey}:map`, mapTtl === -2 ? TTL_EXPIRE_SECONDS : mapTtl);
      const isKeyPresent = await redis.lpos(`${this.connectionKey}:order`, key);
      if (isKeyPresent === null) {
        await redis.rpush(`${this.connectionKey}:order`, key);
        await redis.pexpire(`${this.connectionKey}:order`,  mapTtl === -2 ? TTL_EXPIRE_SECONDS : mapTtl);
      }
    }

    async set(key: string, value: any): Promise<void> {
      this.loggerService.debug(
        `BaseMap set key=${key} connection=${this.connectionKey}`,
        { key, value }
      );
      const redis = await this.redisService.getRedis();
      await redis.hset(`${this.connectionKey}:map`, key, JSON.stringify(value));
      const isKeyPresent = await redis.lpos(`${this.connectionKey}:order`, key);
      if (isKeyPresent === null) {
        await redis.rpush(`${this.connectionKey}:order`, key);
      }
      await redis.expire(`${this.connectionKey}:map`, TTL_EXPIRE_SECONDS);
      await redis.expire(`${this.connectionKey}:order`, TTL_EXPIRE_SECONDS);
    }

    async get(key: string): Promise<any | null> {
      this.loggerService.debug(
        `BaseMap get key=${key} connection=${this.connectionKey}`
      );
      const redis = await this.redisService.getRedis();
      const value = await redis.hget(`${this.connectionKey}:map`, key);
      return value ? JSON.parse(value) : null;
    }

    async delete(key: string): Promise<void> {
      this.loggerService.debug(
        `BaseMap delete key=${key} connection=${this.connectionKey}`
      );
      const redis = await this.redisService.getRedis();
      await redis.hdel(`${this.connectionKey}:map`, key);
      await redis.lrem(`${this.connectionKey}:order`, 0, key);
    }

    async has(key: string): Promise<boolean> {
      this.loggerService.debug(
        `BaseMap has key=${key} connection=${this.connectionKey}`
      );
      const redis = await this.redisService.getRedis();
      return (await redis.hexists(`${this.connectionKey}:map`, key)) === 1;
    }

    async clear(): Promise<void> {
      this.loggerService.debug(`BaseMap clear connection=${this.connectionKey}`);
      const redis = await this.redisService.getRedis();
      await redis.del(`${this.connectionKey}:map`);
      await redis.del(`${this.connectionKey}:order`);
    }

    async *[Symbol.asyncIterator](): AsyncIterableIterator<[string, any]> {
      this.loggerService.debug(
        `BaseMap iterate connection=${this.connectionKey}`
      );
      const redis = await this.redisService.getRedis();
      const batchSize = ITERATOR_BATCH_SIZE;
      let start = 0;

      while (true) {
        const keys = await redis.lrange(
          `${this.connectionKey}:order`,
          start,
          start + batchSize - 1
        );
        if (keys.length === 0) {
          break;
        }

        const values = await Promise.all(
          keys.map((key) =>
            redis.hget(`${this.connectionKey}:map`, key).catch(() => null)
          )
        );

        for (let i = 0; i < keys.length; i++) {
          if (typeof values[i] !== "string") {
            this.loggerService.debug(
              `BaseMap iterate missing value for key=${keys[i]} connection=${this.connectionKey}`
            );
            continue;
          }
          yield [keys[i], values[i] ? JSON.parse(values[i]!) : null];
        }

        start += batchSize;
      }
    }

    async *keys(): AsyncIterableIterator<string> {
      this.loggerService.debug(
        `BaseMap iterate keys connection=${this.connectionKey}`
      );
      const redis = await this.redisService.getRedis();
      const batchSize = ITERATOR_BATCH_SIZE;
      let start = 0;

      while (true) {
        const keys = await redis.lrange(
          `${this.connectionKey}:order`,
          start,
          start + batchSize - 1
        );
        if (keys.length === 0) {
          break;
        }

        for (const key of keys) {
          yield key;
        }

        start += batchSize;
      }
    }

    async *values(): AsyncIterableIterator<any> {
      this.loggerService.debug(
        `BaseMap iterate values connection=${this.connectionKey}`
      );
      const redis = await this.redisService.getRedis();
      const batchSize = ITERATOR_BATCH_SIZE;
      let start = 0;

      while (true) {
        const keys = await redis.lrange(
          `${this.connectionKey}:order`,
          start,
          start + batchSize - 1
        );
        if (keys.length === 0) {
          break;
        }

        const values = await Promise.all(
          keys.map((key) =>
            redis.hget(`${this.connectionKey}:map`, key).catch(() => null)
          )
        );

        for (let i = 0; i < keys.length; i++) {
          if (typeof values[i] !== "string") {
            this.loggerService.debug(
              `BaseMap iterate values missing value for key=${keys[i]} connection=${this.connectionKey}`
            );
            continue;
          }
          yield JSON.parse(values[i]!);
        }

        start += batchSize;
      }
    }

    async getFirst(): Promise<any | null> {
      this.loggerService.debug(
        `BaseMap getFirst connection=${this.connectionKey}`
      );
      const redis = await this.redisService.getRedis();
      const firstKey = await redis.lindex(`${this.connectionKey}:order`, 0);
      if (!firstKey) {
        return null;
      }
      const firstValue = await this.get(firstKey);
      if (!firstValue) {
        return null;
      }
      return [firstKey, firstValue];
    }

    async shift(): Promise<any | null> {
      this.loggerService.debug(`BaseMap shift connection=${this.connectionKey}`);
      const redis = await this.redisService.getRedis();
      const firstKey = await redis.lpop(`${this.connectionKey}:order`);
      if (firstKey) {
        const value = this.get(firstKey);
        await this.delete(firstKey);
        return value;
      }
      return null;
    }

    async size(): Promise<number> {
      this.loggerService.debug(`BaseMap size connection=${this.connectionKey}`);
      const redis = await this.redisService.getRedis();
      return await redis.llen(`${this.connectionKey}:order`);
    }
  }
);

export type TBaseMap = InstanceType<ReturnType<typeof BaseMap>>;

export default BaseMap;
