import BaseConnection from "src/common/BaseConnection";
import createConnectionKey from "src/utils/createConnectionKey";

export class HostSseWebConnection extends BaseConnection(createConnectionKey("host-sse", "web")) {
}

export type THostSseWebConnection = InstanceType<typeof HostSseWebConnection>;

export default HostSseWebConnection;
