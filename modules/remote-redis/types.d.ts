import Redis from 'ioredis';
import { BehaviorSubject } from 'functools-kit';

declare class ErrorService {
    handleGlobalError: (error: Error) => never;
    private _listenForError;
    protected init: () => void;
}

declare class LoggerService {
    private _logger;
    log: (...args: any[]) => void;
    setPrefix: (prefix: string) => void;
}

declare class RedisService {
    private readonly loggerService;
    readonly redisSubject: BehaviorSubject<Redis>;
    getRedis: () => Promise<Redis>;
    protected init: () => void;
}

declare const HostSseClientConnection_base: (new () => {
    readonly redisService: RedisService;
    readonly loggerService: LoggerService;
    readonly connectionKey: string;
    push(value: object): Promise<void>;
    shift(): Promise<object | null>;
    length(): Promise<number>;
    getFirst(): Promise<object | null>;
    [Symbol.asyncIterator](): AsyncIterableIterator<object>;
}) & Omit<{
    new (connectionKey: string): {
        readonly redisService: RedisService;
        readonly loggerService: LoggerService;
        readonly connectionKey: string;
        push(value: object): Promise<void>;
        shift(): Promise<object | null>;
        length(): Promise<number>;
        getFirst(): Promise<object | null>;
        [Symbol.asyncIterator](): AsyncIterableIterator<object>;
    };
}, "prototype">;
declare class HostSseClientConnection extends HostSseClientConnection_base {
}

declare const HostWsClientConnection_base: (new () => {
    readonly redisService: RedisService;
    readonly loggerService: LoggerService;
    readonly connectionKey: string;
    push(value: object): Promise<void>;
    shift(): Promise<object | null>;
    length(): Promise<number>;
    getFirst(): Promise<object | null>;
    [Symbol.asyncIterator](): AsyncIterableIterator<object>;
}) & Omit<{
    new (connectionKey: string): {
        readonly redisService: RedisService;
        readonly loggerService: LoggerService;
        readonly connectionKey: string;
        push(value: object): Promise<void>;
        shift(): Promise<object | null>;
        length(): Promise<number>;
        getFirst(): Promise<object | null>;
        [Symbol.asyncIterator](): AsyncIterableIterator<object>;
    };
}, "prototype">;
declare class HostWsClientConnection extends HostWsClientConnection_base {
}

declare const MsgClientClientConnection_base: (new () => {
    readonly redisService: RedisService;
    readonly loggerService: LoggerService;
    readonly connectionKey: string;
    push(value: object): Promise<void>;
    shift(): Promise<object | null>;
    length(): Promise<number>;
    getFirst(): Promise<object | null>;
    [Symbol.asyncIterator](): AsyncIterableIterator<object>;
}) & Omit<{
    new (connectionKey: string): {
        readonly redisService: RedisService;
        readonly loggerService: LoggerService;
        readonly connectionKey: string;
        push(value: object): Promise<void>;
        shift(): Promise<object | null>;
        length(): Promise<number>;
        getFirst(): Promise<object | null>;
        [Symbol.asyncIterator](): AsyncIterableIterator<object>;
    };
}, "prototype">;
declare class MsgClientClientConnection extends MsgClientClientConnection_base {
}

declare const MsgServerServerConnection_base: (new () => {
    readonly redisService: RedisService;
    readonly loggerService: LoggerService;
    readonly connectionKey: string;
    push(value: object): Promise<void>;
    shift(): Promise<object | null>;
    length(): Promise<number>;
    getFirst(): Promise<object | null>;
    [Symbol.asyncIterator](): AsyncIterableIterator<object>;
}) & Omit<{
    new (connectionKey: string): {
        readonly redisService: RedisService;
        readonly loggerService: LoggerService;
        readonly connectionKey: string;
        push(value: object): Promise<void>;
        shift(): Promise<object | null>;
        length(): Promise<number>;
        getFirst(): Promise<object | null>;
        [Symbol.asyncIterator](): AsyncIterableIterator<object>;
    };
}, "prototype">;
declare class MsgServerServerConnection extends MsgServerServerConnection_base {
}

declare const redis: {
    hostSseClientConnection: HostSseClientConnection;
    hostWsClientConnection: HostWsClientConnection;
    msgClientClientConnection: MsgClientClientConnection;
    msgServerServerConnection: MsgServerServerConnection;
    redisService: RedisService;
    loggerService: LoggerService;
    errorService: ErrorService;
};

export { redis };
