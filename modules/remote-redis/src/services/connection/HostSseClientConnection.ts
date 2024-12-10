import BaseList from "src/common/BaseList";
import createConnectionKey from "src/utils/createConnectionKey";

export class HostSseClientConnection extends BaseList(createConnectionKey("host-sse", "client")) {
}

export type THostSseClientConnection = InstanceType<typeof HostSseClientConnection>;

export default HostSseClientConnection;
