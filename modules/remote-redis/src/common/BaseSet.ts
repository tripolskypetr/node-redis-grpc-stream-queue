import { factory } from "di-factory";
import TYPES from "src/config/types";
import { inject } from "src/core/di";
import LoggerService from "src/services/base/LoggerService";
import RedisService from "src/services/base/RedisService";

const DEFAULT_TTL_EXPIRE_SECONDS = 5 * 60;
const CHUNK_SIZE = 100;

export const BaseSet = factory(
  class {
    readonly redisService = inject<RedisService>(TYPES.redisService);
    readonly loggerService = inject<LoggerService>(TYPES.loggerService);

    constructor(
      readonly connectionKey: string,
      readonly TTL_EXPIRE_SECONDS = DEFAULT_TTL_EXPIRE_SECONDS
    ) {}

    async addWithKeepExpire(value: string): Promise<void> {
      this.loggerService.debug(
        `BaseList addWithKeepExpire connection=${this.connectionKey}`,
        { value }
      );
      const redis = await this.redisService.getRedis();
      const ttl = await redis.pttl(this.connectionKey);
      await redis.sadd(this.connectionKey, value);
      if (this.TTL_EXPIRE_SECONDS === -1) {
        await redis.persist(this.connectionKey);
        return;
      }
      await redis.pexpire(
        this.connectionKey,
        ttl === -2 ? this.TTL_EXPIRE_SECONDS : ttl
      );
    }

    async add(value: string): Promise<void> {
      this.loggerService.debug(`BaseSet add connection=${this.connectionKey}`, {
        value,
      });
      const redis = await this.redisService.getRedis();
      await redis.sadd(this.connectionKey, value);
      if (this.TTL_EXPIRE_SECONDS === -1) {
        await redis.persist(this.connectionKey);
      } else {
        await redis.expire(this.connectionKey, this.TTL_EXPIRE_SECONDS);
      }
    }

    async remove(value: string): Promise<void> {
      this.loggerService.debug(
        `BaseSet remove connection=${this.connectionKey}`,
        { value }
      );
      const redis = await this.redisService.getRedis();
      await redis.srem(this.connectionKey, value);
    }

    async has(value: string): Promise<boolean> {
      this.loggerService.debug(`BaseSet has connection=${this.connectionKey}`, {
        value,
      });
      const redis = await this.redisService.getRedis();
      return (await redis.sismember(this.connectionKey, value)) === 1;
    }

    async clear(): Promise<void> {
      this.loggerService.debug(
        `BaseSet clear connection=${this.connectionKey}`
      );
      const redis = await this.redisService.getRedis();
      await redis.del(this.connectionKey);
    }

    async size(): Promise<number> {
      this.loggerService.debug(`BaseSet size connection=${this.connectionKey}`);
      const redis = await this.redisService.getRedis();
      return await redis.scard(this.connectionKey);
    }

    async *[Symbol.asyncIterator](): AsyncIterableIterator<string> {
      this.loggerService.debug(
        `BaseSet iterate connection=${this.connectionKey}`
      );
      const redis = await this.redisService.getRedis();
      let cursor = 0;

      do {
        const [nextCursor, chunk] = await redis.sscan(
          this.connectionKey,
          cursor,
          "COUNT",
          CHUNK_SIZE
        );
        cursor = parseInt(nextCursor, 10);
        for (const member of chunk) {
          yield member;
        }
      } while (cursor !== 0);
    }
  }
);

export type TBaseSet = InstanceType<ReturnType<typeof BaseSet>>;

export default BaseSet;
