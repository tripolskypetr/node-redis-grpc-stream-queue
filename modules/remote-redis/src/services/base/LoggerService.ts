import { createLogger } from 'pinolog';

export class LoggerService {

    private _logger = createLogger("remote-redis.log");

    public log = (...args: any[]) => {
        this._logger.log(...args);
    }

    public setPrefix = (prefix: string) => {
        this._logger = createLogger(`remote-redis_${prefix}.log`);
    }

}

export default LoggerService
