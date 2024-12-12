import { createLogger } from 'pinolog';

export class LoggerService {

    private _logger = createLogger("remote-redis.log");
    private _debug = false;

    public log = (...args: any[]) => {
        this._logger.log(...args);
    }

    public debug = (...args: any[]) => {
        if (!this._debug) {
            return;
        }
        this._logger.info(...args);
    };

    public setPrefix = (prefix: string) => {
        this._logger = createLogger(`remote-redis_${prefix}.log`);
    }

    public setDebug = (debug: boolean) => {
        this._debug = debug;
    };

}

export default LoggerService
