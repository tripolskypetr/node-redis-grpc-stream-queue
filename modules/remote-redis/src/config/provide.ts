import { provide } from "src/core/di";
import TYPES from "./types";
import RedisService from "src/services/base/RedisService";
import LoggerService from "src/services/base/LoggerService";
import ErrorService from "src/services/base/ErrorService";
import HostSseClientConnection from "src/services/connection/HostSseClientConnection";
import HostWsClientConnection from "src/services/connection/HostWsClientConnection";
import MsgClientClientConnection from "src/services/connection/MsgClientClientConnection";
import MsgServerServerConnection from "src/services/connection/MsgServerServerConnection";
import HostSseWebConnection from "src/services/connection/HostSseWebConnection";
import HostWsWebConnection from "src/services/connection/HostWsWebConnection";

{
    provide(TYPES.redisService, () => new RedisService());
    provide(TYPES.loggerService, () => new LoggerService());
    provide(TYPES.errorService, () => new ErrorService());
}

{
    provide(TYPES.hostSseClientConnection, () => new HostSseClientConnection());
    provide(TYPES.hostWsClientConnection, () => new HostWsClientConnection());
    provide(TYPES.hostSseWebConnection, () => new HostSseWebConnection());
    provide(TYPES.hostWsWebConnection, () => new HostWsWebConnection());
    provide(TYPES.msgClientClientConnection, () => new MsgClientClientConnection());
    provide(TYPES.msgServerServerConnection, () => new MsgServerServerConnection());
}
