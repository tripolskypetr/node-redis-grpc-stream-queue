import BaseConnection from "src/common/BaseConnection";
import createConnectionKey from "src/utils/createConnectionKey";

export class HostWsClientConnection extends BaseConnection(createConnectionKey("host-ws", "client")) {
}

export type THostWsClientConnection = InstanceType<typeof HostWsClientConnection>;

export default HostWsClientConnection;
