import { inject } from "src/core/di";
import LoggerService from "./LoggerService";
import TYPES from "src/config/types";
import Redis from "ioredis";
import {
  CC_REDIS_HOST,
  CC_REDIS_PASSWORD,
  CC_REDIS_PORT,
} from "src/config/params";
import { BehaviorSubject, errorData, TIMEOUT_SYMBOL, waitForNext } from "functools-kit";

const config = {
  host: CC_REDIS_HOST,
  port: CC_REDIS_PORT,
  password: CC_REDIS_PASSWORD,
} as const;

export class RedisService {
  private readonly loggerService = inject<LoggerService>(TYPES.loggerService);

  public readonly redisSubject = new BehaviorSubject<Redis>(null);

  public getRedis = async () => {
    if (this.redisSubject.data) {
        return this.redisSubject.data;
    }
    const redis = await waitForNext(this.redisSubject, (redis) => !!redis);
    if (redis === TIMEOUT_SYMBOL) {
        throw new Error('Redis await timeout');
    }
    return redis;
  }

  protected init = () => {
    const redis = new Redis(config);
    redis.on("connect", () => {
      this.loggerService.log("Successfully connected to Redis", config);
      this.redisSubject.next(redis);
    });
    redis.on('error', (error) => {
        this.loggerService.log("Redis connection failed", config);
        throw error;
    });
  };
}

export default RedisService;
