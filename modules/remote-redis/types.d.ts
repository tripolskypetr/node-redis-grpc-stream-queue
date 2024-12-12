import Redis from 'ioredis';
import * as functools_kit from 'functools-kit';
import { BehaviorSubject, Subject, IPubsubWrappedFn } from 'functools-kit';
import RedisService$1 from 'src/services/base/RedisService';

declare class ErrorService {
    handleGlobalError: (error: Error) => never;
    private _listenForError;
    protected init: () => void;
}

declare class LoggerService {
    private _logger;
    private _debug;
    log: (...args: any[]) => void;
    debug: (...args: any[]) => void;
    setPrefix: (prefix: string) => void;
    setDebug: (debug: boolean) => void;
}

declare class RedisService {
    private readonly loggerService;
    readonly redisSubject: BehaviorSubject<Redis>;
    getRedis: () => Promise<Redis>;
    private makePingInterval;
    protected init: () => void;
}

declare const HostSseClientConnection_base: (new () => {
    readonly redisService: RedisService;
    readonly loggerService: LoggerService;
    readonly connectionKey: string;
    pushWithKeepExpire(value: any): Promise<void>;
    push(value: any): Promise<void>;
    shift(): Promise<any | null>;
    length(): Promise<number>;
    getFirst(): Promise<any | null>;
    clear(): Promise<void>;
    [Symbol.asyncIterator](): AsyncIterableIterator<any>;
}) & Omit<{
    new (connectionKey: string): {
        readonly redisService: RedisService;
        readonly loggerService: LoggerService;
        readonly connectionKey: string;
        pushWithKeepExpire(value: any): Promise<void>;
        push(value: any): Promise<void>;
        shift(): Promise<any | null>;
        length(): Promise<number>;
        getFirst(): Promise<any | null>;
        clear(): Promise<void>;
        [Symbol.asyncIterator](): AsyncIterableIterator<any>;
    };
}, "prototype">;
declare class HostSseClientConnection extends HostSseClientConnection_base {
}

declare const HostWsClientConnection_base: (new () => {
    readonly redisService: RedisService;
    readonly loggerService: LoggerService;
    readonly connectionKey: string;
    pushWithKeepExpire(value: any): Promise<void>;
    push(value: any): Promise<void>;
    shift(): Promise<any | null>;
    length(): Promise<number>;
    getFirst(): Promise<any | null>;
    clear(): Promise<void>;
    [Symbol.asyncIterator](): AsyncIterableIterator<any>;
}) & Omit<{
    new (connectionKey: string): {
        readonly redisService: RedisService;
        readonly loggerService: LoggerService;
        readonly connectionKey: string;
        pushWithKeepExpire(value: any): Promise<void>;
        push(value: any): Promise<void>;
        shift(): Promise<any | null>;
        length(): Promise<number>;
        getFirst(): Promise<any | null>;
        clear(): Promise<void>;
        [Symbol.asyncIterator](): AsyncIterableIterator<any>;
    };
}, "prototype">;
declare class HostWsClientConnection extends HostWsClientConnection_base {
}

declare const MsgClientClientConnection_base: (new () => {
    readonly redisService: RedisService;
    readonly loggerService: LoggerService;
    readonly connectionKey: string;
    pushWithKeepExpire(value: any): Promise<void>;
    push(value: any): Promise<void>;
    shift(): Promise<any | null>;
    length(): Promise<number>;
    getFirst(): Promise<any | null>;
    clear(): Promise<void>;
    [Symbol.asyncIterator](): AsyncIterableIterator<any>;
}) & Omit<{
    new (connectionKey: string): {
        readonly redisService: RedisService;
        readonly loggerService: LoggerService;
        readonly connectionKey: string;
        pushWithKeepExpire(value: any): Promise<void>;
        push(value: any): Promise<void>;
        shift(): Promise<any | null>;
        length(): Promise<number>;
        getFirst(): Promise<any | null>;
        clear(): Promise<void>;
        [Symbol.asyncIterator](): AsyncIterableIterator<any>;
    };
}, "prototype">;
declare class MsgClientClientConnection extends MsgClientClientConnection_base {
}

declare const MsgServerServerConnection_base: (new () => {
    readonly redisService: RedisService;
    readonly loggerService: LoggerService;
    readonly connectionKey: string;
    pushWithKeepExpire(value: any): Promise<void>;
    push(value: any): Promise<void>;
    shift(): Promise<any | null>;
    length(): Promise<number>;
    getFirst(): Promise<any | null>;
    clear(): Promise<void>;
    [Symbol.asyncIterator](): AsyncIterableIterator<any>;
}) & Omit<{
    new (connectionKey: string): {
        readonly redisService: RedisService;
        readonly loggerService: LoggerService;
        readonly connectionKey: string;
        pushWithKeepExpire(value: any): Promise<void>;
        push(value: any): Promise<void>;
        shift(): Promise<any | null>;
        length(): Promise<number>;
        getFirst(): Promise<any | null>;
        clear(): Promise<void>;
        [Symbol.asyncIterator](): AsyncIterableIterator<any>;
    };
}, "prototype">;
declare class MsgServerServerConnection extends MsgServerServerConnection_base {
}

type MessageListener$1<Data = any> = (data: Data) => Promise<boolean>;
type ConnectionEmit = keyof {
    "host-sse__redis-emit": never;
    "host-ws__redis-emit": never;
};
declare const BroadcastRedis: {
    new (connectionEmitId: ConnectionEmit): {
        readonly redisService: RedisService$1;
        _disconnectSubject: Subject<string>;
        _listenerMap: Map<string, IPubsubWrappedFn<any>>;
        _emitMap: Map<string, MessageListener$1<any>>;
        getEmitQueue: ((id: string) => {
            readonly redisService: RedisService$1;
            readonly loggerService: LoggerService;
            readonly connectionKey: string;
            setWithKeepExpire(key: string, value: any): Promise<void>;
            set(key: string, value: any): Promise<void>;
            get(key: string): Promise<any | null>;
            delete(key: string): Promise<void>;
            has(key: string): Promise<boolean>;
            clear(): Promise<void>;
            keys(): AsyncIterableIterator<string>;
            values(): AsyncIterableIterator<any>;
            getFirst(): Promise<any | null>;
            shift(): Promise<any | null>;
            size(): Promise<number>;
            [Symbol.asyncIterator](): AsyncIterableIterator<[string, any]>;
        }) & functools_kit.IClearableMemoize<string> & functools_kit.IControlMemoize<string, {
            readonly redisService: RedisService$1;
            readonly loggerService: LoggerService;
            readonly connectionKey: string;
            setWithKeepExpire(key: string, value: any): Promise<void>;
            set(key: string, value: any): Promise<void>;
            get(key: string): Promise<any | null>;
            delete(key: string): Promise<void>;
            has(key: string): Promise<boolean>;
            clear(): Promise<void>;
            keys(): AsyncIterableIterator<string>;
            values(): AsyncIterableIterator<any>;
            getFirst(): Promise<any | null>;
            shift(): Promise<any | null>;
            size(): Promise<number>;
            [Symbol.asyncIterator](): AsyncIterableIterator<[string, any]>;
        }>;
        readonly connectionEmitId: ConnectionEmit;
        listenEvent: <Data = any>(id: string, emit: MessageListener$1<Data>) => Promise<void>;
        listenDisconnect: (id: string, fn: () => void) => void;
        _getTotalListeners: () => Promise<string[]>;
        _pushOnlineListener: (id: string) => Promise<void>;
        emit: <Data = any>(data: Data) => Promise<void>;
    };
} & {
    clear(): void;
    clear(connectionEmitId: "host-sse__redis-emit" | "host-ws__redis-emit"): void;
};
type TBroadcastRedis = InstanceType<typeof BroadcastRedis>;

type MessageListener<Data = any> = (data: Data) => Promise<boolean>;
declare const BroadcastMemory: {
    new (connectionPoolId: string): {
        _disconnectSubject: Subject<string>;
        _listenerMap: Map<string, IPubsubWrappedFn<any>>;
        _emitMap: Map<string, MessageListener<any>>;
        readonly connectionPoolId: string;
        listenEvent: <Data = any>(id: string, emit: MessageListener<Data>) => Promise<void>;
        listenDisconnect: (id: string, fn: () => void) => void;
        emit: <Data = any>(data: Data) => void;
    };
} & {
    clear(): void;
    clear(connectionPoolId: string): void;
};
type TBroadcastMemory = InstanceType<typeof BroadcastMemory>;

declare const redis: {
    hostSseClientConnection: HostSseClientConnection;
    hostWsClientConnection: HostWsClientConnection;
    msgClientClientConnection: MsgClientClientConnection;
    msgServerServerConnection: MsgServerServerConnection;
    redisService: RedisService;
    loggerService: LoggerService;
    errorService: ErrorService;
};

export { BroadcastMemory, BroadcastRedis, type TBroadcastMemory, type TBroadcastRedis, redis };
