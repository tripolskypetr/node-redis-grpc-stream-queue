import BaseList from "src/common/BaseList";
import createConnectionKey from "src/utils/createConnectionKey";

export class HostWsClientConnection extends BaseList(createConnectionKey("host-ws", "client")) {
}

export type THostWsClientConnection = InstanceType<typeof HostWsClientConnection>;

export default HostWsClientConnection;
