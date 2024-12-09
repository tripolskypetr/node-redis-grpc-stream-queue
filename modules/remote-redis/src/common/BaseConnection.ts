import { factory } from 'di-factory';
import TYPES from 'src/config/types';
import { inject } from 'src/core/di';
import LoggerService from 'src/services/base/LoggerService';
import RedisService from 'src/services/base/RedisService';

export const BaseConnection = factory(class {
  
  readonly redisService = inject<RedisService>(TYPES.redisService);
  readonly loggerService = inject<LoggerService>(TYPES.loggerService);

  constructor(readonly connectionKey: string) {
  }

  async push(value: object): Promise<void> {
    this.loggerService.log(`BaseConnection push connection=${this.connectionKey}`, { value });
    const redis = await this.redisService.getRedis();
    await redis.rpush(this.connectionKey, JSON.stringify(value));
  }

  async shift(): Promise<object | null> {
    this.loggerService.log(`BaseConnection shift connection=${this.connectionKey}`);
    const redis = await this.redisService.getRedis();
    const value = await redis.lpop(this.connectionKey);
    return value ? JSON.parse(value) : null;
  }

  async length(): Promise<number> {
    this.loggerService.log(`BaseConnection length connection=${this.connectionKey}`);
    const redis = await this.redisService.getRedis();
    return await redis.llen(this.connectionKey);
  }

  async getFirst(): Promise<object | null> {
    this.loggerService.log(`BaseConnection getFirst connection=${this.connectionKey}`);
    const redis = await this.redisService.getRedis();
    const value = await redis.lindex(this.connectionKey, 0);
    return value ? JSON.parse(value) : null;
  }

  async *[Symbol.asyncIterator](): AsyncIterableIterator<object> {
    this.loggerService.log(`BaseConnection iterate connection=${this.connectionKey}`);
    const redis = await this.redisService.getRedis();
    const length = await this.length();
    for (let i = 0; i < length; i++) {
      const value = await redis.lindex(this.connectionKey, i);
      yield value ? JSON.parse(value) : null;
    }
  }

})

export type TBaseConnection = InstanceType<ReturnType<typeof BaseConnection>>;

export default BaseConnection;
