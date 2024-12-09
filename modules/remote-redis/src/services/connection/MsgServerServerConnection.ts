import BaseConnection from "src/common/BaseConnection";
import createConnectionKey from "src/utils/createConnectionKey";

export class MsgServerServerConnection extends BaseConnection(createConnectionKey("msg-server", "server")) {
}

export type TMsgServerServerConnection = InstanceType<typeof MsgServerServerConnection>;

export default MsgServerServerConnection;
