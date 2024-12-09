import BaseConnection from "src/common/BaseConnection";
import createConnectionKey from "src/utils/createConnectionKey";

export class HostWsWebConnection extends BaseConnection(createConnectionKey("host-ws", "web")) {
}

export type THostWsWebConnection = InstanceType<typeof HostWsWebConnection>;

export default HostWsWebConnection;
