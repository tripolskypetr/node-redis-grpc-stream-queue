import { factory } from 'di-factory';
import TYPES from 'src/config/types';
import { inject } from 'src/core/di';
import LoggerService from 'src/services/base/LoggerService';
import RedisService from 'src/services/base/RedisService';

const TTL_EXPIRE_SECONDS = 5 * 60;

export const BaseList = factory(class {
  
  readonly redisService = inject<RedisService>(TYPES.redisService);
  readonly loggerService = inject<LoggerService>(TYPES.loggerService);

  constructor(readonly connectionKey: string) {
  }

  async pushWithKeepExpire(value: any): Promise<void> {
    this.loggerService.log(`BaseList pushWithKeepExpire connection=${this.connectionKey}`, { value });
    const redis = await this.redisService.getRedis();
    const ttl = await redis.pttl(this.connectionKey);
    await redis.rpush(this.connectionKey, JSON.stringify(value));
    await redis.pexpire(this.connectionKey, ttl === -2 ? TTL_EXPIRE_SECONDS : ttl);
  }

  async push(value: any): Promise<void> {
    this.loggerService.log(`BaseList push connection=${this.connectionKey}`, { value });
    const redis = await this.redisService.getRedis();
    await redis.rpush(this.connectionKey, JSON.stringify(value));
    await redis.expire(this.connectionKey, TTL_EXPIRE_SECONDS);
  }

  async shift(): Promise<any | null> {
    this.loggerService.log(`BaseList shift connection=${this.connectionKey}`);
    const redis = await this.redisService.getRedis();
    const value = await redis.lpop(this.connectionKey);
    return value ? JSON.parse(value) : null;
  }

  async length(): Promise<number> {
    this.loggerService.log(`BaseList length connection=${this.connectionKey}`);
    const redis = await this.redisService.getRedis();
    return await redis.llen(this.connectionKey);
  }

  async getFirst(): Promise<any | null> {
    this.loggerService.log(`BaseList getFirst connection=${this.connectionKey}`);
    const redis = await this.redisService.getRedis();
    const value = await redis.lindex(this.connectionKey, 0);
    return value ? JSON.parse(value) : null;
  }

  async *[Symbol.asyncIterator](): AsyncIterableIterator<any> {
    this.loggerService.log(`BaseList iterate connection=${this.connectionKey}`);
    const redis = await this.redisService.getRedis();
    const length = await this.length();
    for (let i = 0; i < length; i++) {
      const value = await redis.lindex(this.connectionKey, i);
      yield value ? JSON.parse(value) : null;
    }
  }

  async clear(): Promise<void> {
    this.loggerService.log(`BaseList clear connection=${this.connectionKey}`);
    const redis = await this.redisService.getRedis();
    await redis.del(this.connectionKey);
  }
})

export type TBaseList = InstanceType<ReturnType<typeof BaseList>>;

export default BaseList;
