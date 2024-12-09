import * as grpc$1 from '@grpc/grpc-js';
import { CC_GRPC_MAP as CC_GRPC_MAP$1 } from 'src/config/params';
import { CANCELED_PROMISE_SYMBOL, Subject, IPubsubWrappedFn } from 'functools-kit';

declare class LoggerService {
    private _logger;
    log: (...args: any[]) => void;
    setPrefix: (prefix: string) => void;
}

declare const CC_GRPC_MAP: {
    readonly FooService: {
        readonly grpcHost: "localhost:50051";
        readonly protoName: "foo_service";
        readonly methodList: readonly ["Execute"];
    };
    readonly BarService: {
        readonly grpcHost: "localhost:50052";
        readonly protoName: "bar_service";
        readonly methodList: readonly ["Execute"];
    };
    readonly BazService: {
        readonly grpcHost: "localhost:50053";
        readonly protoName: "baz_service";
        readonly methodList: readonly ["Execute"];
    };
    readonly MessageService: {
        readonly grpcHost: "localhost:50054";
        readonly protoName: "message_service";
        readonly methodList: readonly ["connect"];
    };
};

type ServiceName$1 = keyof typeof CC_GRPC_MAP;
interface IService {
    [key: string | number | symbol]: Function;
}
declare class ProtoService {
    private readonly loggerService;
    private readonly _protoMap;
    loadProto: (protoName: string) => grpc$1.GrpcObject;
    makeClient: <T = IService>(serviceName: ServiceName$1) => T;
    makeServer: <T = IService>(serviceName: ServiceName$1, connector: T) => void;
}

declare class ErrorService {
    handleGlobalError: (error: Error) => never;
    private _listenForError;
    protected init: () => void;
}

type ServiceName = keyof typeof CC_GRPC_MAP$1;
interface IMessage<Data = object> {
    serviceName: string;
    clientId: string;
    userId: string;
    requestId: string;
    stamp: string;
    data: Data;
}
type SendMessageFn<T = object> = (outgoing: IMessage<T>) => Promise<void | typeof CANCELED_PROMISE_SYMBOL>;
declare class StreamService {
    private readonly protoService;
    private readonly loggerService;
    _serverRef: Map<string, grpc$1.Server>;
    _makeServerInternal: <T = object>(serviceName: ServiceName, connector: (incoming: IMessage<T>) => Promise<void>, reconnect: (error: boolean) => void, attempt: number) => SendMessageFn<any>;
    _makeClientInternal: <T = object>(serviceName: ServiceName, connector: (incoming: IMessage<T>) => Promise<void>, reconnect: (error: boolean) => void, attempt: number) => SendMessageFn<any>;
    makeServer: <T = object>(serviceName: ServiceName, connector: (incoming: IMessage<T>) => Promise<void>) => SendMessageFn<any>;
    makeClient: <T = object>(serviceName: ServiceName, connector: (incoming: IMessage<T>) => Promise<void>) => SendMessageFn<any>;
}

type MessageListener<Data = any> = (data: Data) => Promise<boolean>;
declare const ConnectionManager: {
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
type TConnectionManager = InstanceType<typeof ConnectionManager>;

declare const grpc: {
    fooClientService: {
        readonly protoService: ProtoService;
        readonly loggerService: LoggerService;
        _fooClient: GRPC.IFooService;
        Execute: (...args: any) => Promise<any>;
        init: () => void;
    };
    barClientService: {
        readonly protoService: ProtoService;
        readonly loggerService: LoggerService;
        _barClient: GRPC.IBarService;
        Execute: (...args: any) => Promise<any>;
        init: () => void;
    };
    bazClientService: {
        readonly protoService: ProtoService;
        readonly loggerService: LoggerService;
        _bazClient: GRPC.IBazService;
        Execute: (...args: any) => Promise<any>;
        init: () => void;
    };
    protoService: ProtoService;
    loggerService: LoggerService;
    errorService: ErrorService;
    streamService: StreamService;
};

export { ConnectionManager, type TConnectionManager, grpc };
