import { inject } from "src/core/di";
import type ProtoService from "./ProtoService";
import type LoggerService from "./LoggerService";
import TYPES from "src/config/types";
import { CC_GRPC_MAP } from "src/config/params";
import get from "src/utils/get";
import * as grpc from "@grpc/grpc-js";
import {
  errorData,
  Subject,
  createAwaiter,
  queued,
  CANCELED_PROMISE_SYMBOL,
  singleshot,
  sleep,
  singlerun,
} from "functools-kit";

type Ctor = new (...args: any[]) => grpc.Client;
type ServiceName = keyof typeof CC_GRPC_MAP;

const CHANNEL_OK_SYMBOL = Symbol("channel-ok");
const CHANNEL_ERROR_SYMBOL = Symbol("channel-error");

const CHANNEL_RECONNECT_SYMBOL = Symbol("channel-reconnect");

interface IMessage<Data = object> {
  serviceName: string;
  clientId: string;
  userId: string;
  requestId: string;
  stamp: string;
  data: Data;
}

export type SendMessageFn<T = object> = (
  outgoing: IMessage<T>
) => Promise<void | typeof CANCELED_PROMISE_SYMBOL>;

const GRPC_READY_DELAY = 60_000;
const GRPC_MAX_RETRY = 15;

interface IAwaiter {
  resolve(): void;
}

export class StreamService {
  private readonly protoService = inject<ProtoService>(TYPES.protoService);
  private readonly loggerService = inject<LoggerService>(TYPES.loggerService);

  _serverRef = new Map<string, grpc.Server>();

  _makeServerInternal = <T = object>(
    serviceName: ServiceName,
    connector: (incoming: IMessage<T>) => Promise<void>,
    reconnect: (error: boolean) => void,
    attempt: number
  ): SendMessageFn<any> => {
    this.loggerService.log(
      `remote-grpc streamService _makeServerInternal connecting service=${serviceName} attempt=${attempt}`
    );
    const { grpcHost, protoName } = CC_GRPC_MAP[serviceName];
    const proto = this.protoService.loadProto(protoName);

    let isRunning = false;

    const errorSubject = new Subject<typeof CHANNEL_ERROR_SYMBOL>();
    const succeedSubject = new Subject<typeof CHANNEL_OK_SYMBOL>();
    const messageSubject = new Subject<IMessage>();

    {
      const prevServer = this._serverRef.get(serviceName);
      prevServer && prevServer.forceShutdown();
    }

    const server = new grpc.Server();
    this._serverRef.set(serviceName, server);

    server.addService(
      get(proto, `${serviceName}.service`) as unknown as grpc.ServiceDefinition,
      {
        connect: (
          call: grpc.ServerWritableStream<IMessage<string>, IMessage<string>>
        ) => {
          if (isRunning) {
            call.emit("error", {
              code: grpc.status.INVALID_ARGUMENT,
              message: "Only one bidirectional connection allowed",
            });
            return;
          }

          isRunning = true;

          call.on("data", (message: IMessage<string>) => {
            this.loggerService.log(
              `remote-grpc streamService _makeServerInternal incoming service=${serviceName}`,
              { incoming: message }
            );
            connector({
              clientId: message.clientId,
              data: JSON.parse(message.data),
              requestId: message.requestId,
              serviceName: message.serviceName,
              stamp: message.stamp,
              userId: message.userId,
            });
          });
          call.on("drain", () => {
            succeedSubject.next(CHANNEL_OK_SYMBOL);
          });
          call.on("end", () => {
            this.loggerService.log(
              `remote-grpc streamService _makeServerInternal Server stream end for ${serviceName}, host=${grpcHost}`
            );
            call.end();
            errorSubject.next(CHANNEL_ERROR_SYMBOL);
            reconnect(false);
          });
          call.on("cancel", () => {
            this.loggerService.log(
              `remote-grpc streamService _makeServerInternal Server stream cancel for ${serviceName}, host=${grpcHost}`
            );
            errorSubject.next(CHANNEL_ERROR_SYMBOL);
            reconnect(false);
          });
          call.on("close", () => {
            this.loggerService.log(
              `remote-grpc streamService _makeServerInternal Server stream close for ${serviceName}, host=${grpcHost}`
            );
            errorSubject.next(CHANNEL_ERROR_SYMBOL);
            reconnect(false);
          });
          call.on("error", (err) => {
            this.loggerService.log(
              `remote-grpc streamService _makeServerInternal Server stream error for ${serviceName}, host=${grpcHost}, error=${JSON.stringify(errorData(err))}`
            );
            errorSubject.next(CHANNEL_ERROR_SYMBOL);
            reconnect(true);
          });

          messageSubject.subscribe(async (outgoing: IMessage) => {
            call.write(
              {
                clientId: outgoing.clientId,
                requestId: outgoing.requestId,
                serviceName: outgoing.serviceName,
                userId: outgoing.userId,
                stamp: outgoing.stamp,
                data: JSON.stringify(outgoing.data),
              },
              (err: any) => {
                if (err) {
                  errorSubject.next(CHANNEL_ERROR_SYMBOL);
                  return;
                }
                succeedSubject.next(CHANNEL_OK_SYMBOL);
              }
            );
            const result = await Promise.race([
              errorSubject.toPromise(),
              succeedSubject.toPromise(),
            ]);
            if (result === CHANNEL_ERROR_SYMBOL) {
              return Promise.reject();
            }
            return Promise.resolve();
          });
        },
      }
    );

    server.bindAsync(
      grpcHost,
      grpc.ServerCredentials.createInsecure(),
      (error) => {
        if (error) {
          throw new (class extends Error {
            constructor() {
              super(
                `Failed to stream the server ${serviceName}, host=${grpcHost}`
              );
            }
            originalError = errorData(error);
          })();
        }
      }
    );

    return async (outgoing: IMessage) => {
      await messageSubject.waitForListener();
      await messageSubject.next(outgoing);
    };
  };

  _makeClientInternal = <T = object>(
    serviceName: ServiceName,
    connector: (incoming: IMessage<T>) => Promise<void>,
    reconnect: (error: boolean) => void,
    attempt: number
  ): SendMessageFn<any> => {
    this.loggerService.log(
      `remote-grpc streamService _makeClientInternal connecting service=${serviceName} attempt=${attempt}`
    );
    const { grpcHost, protoName } = CC_GRPC_MAP[serviceName];
    const proto = this.protoService.loadProto(protoName);
    const Ctor = get(proto, serviceName) as unknown as Ctor;
    const grpcClient = new Ctor(grpcHost, grpc.credentials.createInsecure());

    const errorSubject = new Subject<typeof CHANNEL_ERROR_SYMBOL>();
    const succeedSubject = new Subject<typeof CHANNEL_OK_SYMBOL>();
    const messageSubject = new Subject<IMessage>();

    grpcClient.waitForReady(Date.now() + GRPC_READY_DELAY, (err) => {
      if (err) {
        throw new (class extends Error {
          constructor() {
            super(
              `Failed to listen the server ${serviceName}, host=${grpcHost}`
            );
          }
          originalError = errorData(err);
        })();
      }
      const fn = get(grpcClient, "connect").bind(grpcClient);
      const call = fn() as grpc.ClientWritableStream<IMessage<string>>;
      call.on("data", (message: IMessage<string>) => {
        this.loggerService.log(
          `remote-grpc streamService _makeClientInternal incoming service=${serviceName}`,
          { incoming: message }
        );
        connector({
          clientId: message.clientId,
          data: JSON.parse(message.data),
          requestId: message.requestId,
          serviceName: message.serviceName,
          stamp: message.stamp,
          userId: message.userId,
        });
      });
      call.on("drain", () => {
        succeedSubject.next(CHANNEL_OK_SYMBOL);
      });
      call.on("end", () => {
        this.loggerService.log(
          `remote-grpc streamService _makeClientInternal Client stream end for ${serviceName}, host=${grpcHost}`
        );
        call.end();
        errorSubject.next(CHANNEL_ERROR_SYMBOL);
        reconnect(false);
      });
      call.on("cancel", () => {
        this.loggerService.log(
          `remote-grpc streamService _makeClientInternal Client stream cancel for ${serviceName}, host=${grpcHost}`
        );
        errorSubject.next(CHANNEL_ERROR_SYMBOL);
        reconnect(false);
      });
      call.on("close", () => {
        this.loggerService.log(
          `remote-grpc streamService _makeClientInternal Client stream close for ${serviceName}, host=${grpcHost}`
        );
        errorSubject.next(CHANNEL_ERROR_SYMBOL);
        reconnect(false);
      });
      call.on("error", (err) => {
        this.loggerService.log(
          `remote-grpc streamService _makeClientInternal Client stream error for ${serviceName}, host=${grpcHost}, error=${JSON.stringify(errorData(err))}`
        );
        errorSubject.next(CHANNEL_ERROR_SYMBOL);
        reconnect(true);
      });
      messageSubject.subscribe(async (outgoing: IMessage) => {
        this.loggerService.log(
          `remote-grpc streamService _makeClientInternal outgoing service=${serviceName}`,
          { outgoing }
        );
        call.write(
          {
            clientId: outgoing.clientId,
            requestId: outgoing.requestId,
            serviceName: outgoing.serviceName,
            userId: outgoing.userId,
            stamp: outgoing.stamp,
            data: JSON.stringify(outgoing.data),
          },
          (err: any) => {
            if (err) {
              errorSubject.next(CHANNEL_ERROR_SYMBOL);
              return;
            }
            succeedSubject.next(CHANNEL_OK_SYMBOL);
          }
        );
        const result = await Promise.race([
          errorSubject.toPromise(),
          succeedSubject.toPromise(),
        ]);
        if (result === CHANNEL_ERROR_SYMBOL) {
          return Promise.reject();
        }
        return Promise.resolve();
      });
    });

    return async (outgoing: IMessage) => {
      await messageSubject.waitForListener();
      await messageSubject.next(outgoing);
    };
  };

  makeServer = <T = object>(
    serviceName: ServiceName,
    connector: (incoming: IMessage<T>) => Promise<void>
  ): SendMessageFn<any> => {
    this.loggerService.log(
      `remote-grpc streamService makeServer connecting service=${serviceName}`
    );

    const reconnectSubject = new Subject<typeof CHANNEL_RECONNECT_SYMBOL>();

    const queue: [IMessage, IAwaiter][] = [];
    const connectorFn = queued(connector) as typeof connector;

    let attempt = 0;
    let outgoingFnRef: SendMessageFn<any>;

    const makeBroadcast = singlerun(async () => {
      while (queue.length) {
        let isOk = true;
        try {
          const [[outgoingMsg, { resolve }]] = queue;
          const status = await Promise.race([
            outgoingFnRef(outgoingMsg),
            reconnectSubject.toPromise(),
          ]);
          if (status === CHANNEL_RECONNECT_SYMBOL) {
            this.loggerService.log(`remote-grpc streamService makeServer reconnect service=${serviceName}`)
            throw CHANNEL_ERROR_SYMBOL;
          }
          await resolve();
        } catch {
          isOk = false;
        } finally {
          if (isOk) {
            queue.shift();
          }
        }
      }
    });

    {
      const makeConnection = () => {
        if (attempt >= GRPC_MAX_RETRY) {
          throw new Error(
            `remote-grpc streamService makeServer max retry reached service=${serviceName}`
          );
        }
        attempt += 1;
        reconnectSubject.next(CHANNEL_RECONNECT_SYMBOL);
        outgoingFnRef = this._makeServerInternal<T>(
          serviceName,
          connectorFn,
          singleshot(makeConnection),
          attempt
        );
      };
      makeConnection();
      makeBroadcast();
    }

    return async (outgoing: IMessage) => {
      const [awaiter, { resolve }] = createAwaiter<void>();
      queue.push([outgoing, { resolve }]);
      await makeBroadcast();
      attempt = 0;
      return await awaiter;
    };
  };

  makeClient = <T = object>(
    serviceName: ServiceName,
    connector: (incoming: IMessage<T>) => Promise<void>,
    
  ): SendMessageFn<any> => {
    this.loggerService.log(
      `remote-grpc streamService makeClient connecting service=${serviceName}`
    );

    const reconnectSubject = new Subject<typeof CHANNEL_RECONNECT_SYMBOL>();

    const queue: [IMessage, IAwaiter][] = [];
    const connectorFn = queued(connector) as typeof connector;

    let attempt = 0;
    let outgoingFnRef: SendMessageFn<any>;

    const makeBroadcast = singlerun(async () => {
      while (queue.length) {
        let isOk = true;
        try {
          const [[outgoingMsg, { resolve }]] = queue;
          const status = await Promise.race([
            outgoingFnRef(outgoingMsg),
            reconnectSubject.toPromise(),
          ]);
          if (status === CHANNEL_RECONNECT_SYMBOL) {
            this.loggerService.log(`remote-grpc streamService makeClient reconnect service=${serviceName}`)
            throw CHANNEL_ERROR_SYMBOL;
          }
          await resolve();
        } catch {
          isOk = false;
        } finally {
          if (isOk) {
            queue.shift();
          }
        }
      }
    });

    {
      const makeConnection = () => {
        if (attempt >= GRPC_MAX_RETRY) {
          throw new Error(
            `remote-grpc streamService makeClient max retry reached service=${serviceName}`
          );
        }
        attempt += 1;
        reconnectSubject.next(CHANNEL_RECONNECT_SYMBOL);
        outgoingFnRef = this._makeClientInternal<T>(
          serviceName,
          connectorFn,
          singleshot(makeConnection),
          attempt
        );
      };
      makeConnection();
      makeBroadcast();
    }

    return async (outgoing: IMessage) => {
      const [awaiter, { resolve }] = createAwaiter<void>();
      queue.push([outgoing, { resolve }]);
      await makeBroadcast();
      attempt = 0;
      return await awaiter;
    };
  };
}

export default StreamService;
