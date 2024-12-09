import TYPES from "./config/types";
import "./config/provide";
import { inject, init } from "./core/di";
import ErrorService from "./services/base/ErrorService";
import LoggerService from "./services/base/LoggerService";
import RedisService from "./services/base/RedisService";
import HostSseClientConnection from "./services/connection/HostSseClientConnection";
import HostWsClientConnection from "./services/connection/HostWsClientConnection";
import MsgClientClientConnection from "./services/connection/MsgClientClientConnection";
import MsgServerServerConnection from "./services/connection/MsgServerServerConnection";
import HostSseWebConnection from "./services/connection/HostSseWebConnection";
import HostWsWebConnection from "./services/connection/HostWsWebConnection";

const baseServices = {
    redisService: inject<RedisService>(TYPES.redisService),
    loggerService: inject<LoggerService>(TYPES.loggerService),
    errorService: inject<ErrorService>(TYPES.errorService),
};

const dataServices = {
    hostSseClientConnection: inject<HostSseClientConnection>(TYPES.hostSseClientConnection),
    hostWsClientConnection: inject<HostWsClientConnection>(TYPES.hostWsClientConnection),
    hostSseWebConnection: inject<HostSseWebConnection>(TYPES.hostSseWebConnection),
    hostWsWebConnection: inject<HostWsWebConnection>(TYPES.hostWsWebConnection),
    msgClientClientConnection: inject<MsgClientClientConnection>(TYPES.msgClientClientConnection),
    msgServerServerConnection: inject<MsgServerServerConnection>(TYPES.msgServerServerConnection),
};

init();

export const redis = {
    ...baseServices,
    ...dataServices,
}

export { ConnectionManager, TConnectionManager } from './common/ConnectionManager';
