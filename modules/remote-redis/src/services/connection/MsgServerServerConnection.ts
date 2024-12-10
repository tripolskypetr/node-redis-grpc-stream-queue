import BaseList from "src/common/BaseList";
import createConnectionKey from "src/utils/createConnectionKey";

export class MsgServerServerConnection extends BaseList(createConnectionKey("msg-server", "server")) {
}

export type TMsgServerServerConnection = InstanceType<typeof MsgServerServerConnection>;

export default MsgServerServerConnection;
