import BaseList from "src/common/BaseList";
import createConnectionKey from "src/utils/createConnectionKey";

export class MsgClientClientConnection extends BaseList(createConnectionKey("msg-client", "client")) {
}

export type TMsgClientClientConnection = InstanceType<typeof MsgClientClientConnection>;

export default MsgClientClientConnection;
