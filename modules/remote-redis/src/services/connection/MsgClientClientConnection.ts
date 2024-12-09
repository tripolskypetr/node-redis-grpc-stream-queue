import BaseConnection from "src/common/BaseConnection";
import createConnectionKey from "src/utils/createConnectionKey";

export class MsgClientClientConnection extends BaseConnection(createConnectionKey("msg-client", "client")) {
}

export type TMsgClientClientConnection = InstanceType<typeof MsgClientClientConnection>;

export default MsgClientClientConnection;
