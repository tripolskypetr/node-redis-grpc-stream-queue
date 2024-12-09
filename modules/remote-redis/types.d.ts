import Redis from 'ioredis';
import { BehaviorSubject, Subject, IPubsubWrappedFn, IPubsubArray } from 'functools-kit';

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

type MessageListener<Data = any> = (data: Data) => Promise<boolean>;
interface IListenerConfig<Data = any> {
    queue: IPubsubArray<[string, Data]>;
}
declare const ConnectionManager: {
    new (connectionPoolId: string): {
        _disconnectSubject: Subject<string>;
        _listenerMap: Map<string, IPubsubWrappedFn<any>>;
        _emitMap: Map<string, MessageListener<any>>;
        readonly connectionPoolId: string;
        listenEvent: <Data = any>(id: string, emit: MessageListener<Data>, { queue, }?: Partial<IListenerConfig>) => Promise<void>;
        listenDisconnect: (id: string, fn: () => void) => void;
        emit: <Data extends WeakKey = any>(data: Data) => void;
    };
} & {
    clear(): void;
    clear(connectionPoolId: string): void;
};
type TConnectionManager = InstanceType<typeof ConnectionManager>;

declare const redis: {
    hostSseClientConnection: HostSseClientConnection;
    hostWsClientConnection: HostWsClientConnection;
    msgClientClientConnection: MsgClientClientConnection;
    msgServerServerConnection: MsgServerServerConnection;
    redisService: RedisService;
    loggerService: LoggerService;
    errorService: ErrorService;
};

export { ConnectionManager, type TConnectionManager, redis };
