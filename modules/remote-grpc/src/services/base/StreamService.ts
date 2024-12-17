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
  IPubsubArray,
  PubsubArrayAdapter,
  randomString,
} from "functools-kit";
import ErrorService from "./ErrorService";

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

const GRPC_READY_DELAY = 1_000;
const GRPC_RECONNECT_DELAY = 1_000;
const GRPC_MAX_RETRY = 15;

export interface IMakeClientConfig<T = object> {
  queue: IPubsubArray<[string, IMessage<T>]>;
}

export interface IMakeServerConfig<T = object> {
  queue: IPubsubArray<[string, IMessage<T>]>;
}

interface IAwaiter {
  resolve(): void;
}

export class StreamService {
  private readonly protoService = inject<ProtoService>(TYPES.protoService);
  private readonly loggerService = inject<LoggerService>(TYPES.loggerService);
  private readonly errorService = inject<ErrorService>(TYPES.errorService);

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
        this.loggerService.log(
          `remote-grpc streamService _makeClientInternal connection timeout service=${serviceName} attempt=${attempt}`,
          errorData(err),
        );
        reconnect(true);
        return;
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
    connector: (incoming: IMessage<T>) => Promise<void>,
    { queue = new PubsubArrayAdapter() }: Partial<IMakeServerConfig> = {}
  ): SendMessageFn<any> => {
    this.loggerService.log(
      `remote-grpc streamService makeServer connecting service=${serviceName}`
    );

    const reconnectSubject = new Subject<typeof CHANNEL_RECONNECT_SYMBOL>();
    const connectorFn = queued(connector) as typeof connector;

    const awaiterMap = new Map<string, IAwaiter>();

    let attempt = 0;
    let outgoingFnRef: SendMessageFn<any>;

    const makeBroadcast = singlerun(async () => {
      while (await queue.length()) {
        let isOk = true;
        try {
          const first = await queue.getFirst();
          if (!first) {
            break;
          }
          const [id, outgoingMsg] = first;
          const awaiter = awaiterMap.get(id);
          if (!awaiter) {
            this.loggerService.log(
              "remote-grpc streamService makeServer missing awaiter",
              { id, outgoingMsg }
            );
            continue;
          }
          const status = await Promise.race([
            outgoingFnRef(outgoingMsg),
            reconnectSubject.toPromise(),
          ]);
          if (status === CHANNEL_RECONNECT_SYMBOL) {
            this.loggerService.log(
              `remote-grpc streamService makeServer reconnect service=${serviceName}`
            );
            throw CHANNEL_ERROR_SYMBOL;
          }
          attempt = 0;
          await awaiter.resolve();
        } catch {
          isOk = false;
        } finally {
          if (isOk) {
            await queue.shift();
          }
          await sleep(10);
        }
      }
    });

    {
      const makeConnection = () => {
        attempt += 1;
        outgoingFnRef = this._makeServerInternal<T>(
          serviceName,
          connectorFn,
          singleshot(async () => {
            if (attempt >= GRPC_MAX_RETRY) {
              await queue.clear();
              throw new Error(
                `remote-grpc streamService makeServer max retry reached service=${serviceName}`
              );
            }
            await sleep(GRPC_RECONNECT_DELAY);
            makeConnection();
          }),
          attempt
        );
        reconnectSubject.next(CHANNEL_RECONNECT_SYMBOL);
      };
      makeConnection();
    }

    const makeCommit = async (outgoing: IMessage) => {
      const [result, awaiter] = createAwaiter<void>();
      const id = randomString();
      awaiterMap.set(id, awaiter);
      await queue.push([id, outgoing]);
      await makeBroadcast();
      return await result;
    };

    const makeInit = singleshot(async () => {
      const resolveList: Promise<void>[] = [];
      for await (const [id] of queue) {
        const [resolve, awaiter] = createAwaiter<void>();
        awaiterMap.set(id, awaiter);
        resolveList.push(resolve);
      }
      await makeBroadcast();
      await Promise.all(resolveList);
    });

    return async (outgoing: IMessage) => {
      await makeInit();
      await makeCommit(outgoing);
      attempt = 0;
    };
  };

  makeClient = <T = object>(
    serviceName: ServiceName,
    connector: (incoming: IMessage<T>) => Promise<void>,
    { queue = new PubsubArrayAdapter() }: Partial<IMakeClientConfig> = {}
  ): SendMessageFn<any> => {
    this.loggerService.log(
      `remote-grpc streamService makeClient connecting service=${serviceName}`
    );

    const reconnectSubject = new Subject<typeof CHANNEL_RECONNECT_SYMBOL>();
    const connectorFn = queued(connector) as typeof connector;

    const awaiterMap = new Map<string, IAwaiter>();

    let attempt = 0;
    let outgoingFnRef: SendMessageFn<any>;

    const makeBroadcast = singlerun(async () => {
      while (await queue.length()) {
        let isOk = true;
        try {
          const first = await queue.getFirst();
          if (!first) {
            break;
          }
          const [id, outgoingMsg] = first;
          const awaiter = awaiterMap.get(id);
          if (!awaiter) {
            this.loggerService.log(
              "remote-grpc streamService makeClient missing awaiter",
              { id, outgoingMsg }
            );
            continue;
          }
          const status = await Promise.race([
            outgoingFnRef(outgoingMsg),
            reconnectSubject.toPromise(),
          ]);
          if (status === CHANNEL_RECONNECT_SYMBOL) {
            this.loggerService.log(
              `remote-grpc streamService makeClient reconnect service=${serviceName}`
            );
            throw CHANNEL_ERROR_SYMBOL;
          }
          attempt = 0;
          await awaiter.resolve();
        } catch {
          isOk = false;
        } finally {
          if (isOk) {
            await queue.shift();
          }
          await sleep(10);
        }
      }
    });

    {
      const makeConnection = () => {
        attempt += 1;
        outgoingFnRef = this._makeClientInternal<T>(
          serviceName,
          connectorFn,
          singleshot(async () => {
            if (attempt >= GRPC_MAX_RETRY) {
              await queue.clear();
              throw new Error(
                `remote-grpc streamService makeClient max retry reached service=${serviceName}`
              );
            }
            await sleep(GRPC_RECONNECT_DELAY);
            makeConnection();
          }),
          attempt
        );
        reconnectSubject.next(CHANNEL_RECONNECT_SYMBOL);
      };
      makeConnection();
    }

    const makeCommit = async (outgoing: IMessage) => {
      const [result, awaiter] = createAwaiter<void>();
      const id = randomString();
      awaiterMap.set(id, awaiter);
      await queue.push([id, outgoing]);
      await makeBroadcast();
      return await result;
    };

    const makeInit = singleshot(async () => {
      const resolveList: Promise<void>[] = [];
      for await (const [id] of queue) {
        const [resolve, awaiter] = createAwaiter<void>();
        awaiterMap.set(id, awaiter);
        resolveList.push(resolve);
      }
      await makeBroadcast();
      await Promise.all(resolveList);
    });

    return async (outgoing: IMessage) => {
      await makeInit();
      await makeCommit(outgoing);
      attempt = 0;
    };
  };

  protected init = () => {
    const shutdown = () => {
      for (const server of this._serverRef.values()) {
        server.forceShutdown();
      }
    }
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    this.errorService.beforeExitSubject.subscribe(shutdown);
  }
}

export default StreamService;
