import BaseConnection from "src/common/BaseConnection";
import createConnectionKey from "src/utils/createConnectionKey";

export class HostSseClientConnection extends BaseConnection(createConnectionKey("host-sse", "client")) {
}

export type THostSseClientConnection = InstanceType<typeof HostSseClientConnection>;

export default HostSseClientConnection;
