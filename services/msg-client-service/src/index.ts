import { grpc } from "@modules/remote-grpc";
import { redis } from "@modules/remote-redis";

function getSecondsSinceMidnight() {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(0, 0, 0, 0);
    const secondsSinceMidnight = Math.floor((+now - +midnight) / 1000);
    return secondsSinceMidnight;
}

const send = grpc.streamService.makeClient<{ side: string, value: string }>("MessageService", async (message) => {
    console.log(`from=${message.data.side} value=${message.data.value} stamp=${message.stamp}`)
}, {
    queue: redis.msgClientClientConnection,
});

setInterval(() => {
    send({
        clientId: "",
        requestId: "",
        serviceName: "",
        userId: "",
        data: {
            side: "client",
            value: getSecondsSinceMidnight(),
        },
        stamp: Date.now().toString(),
    })
}, 1_000);

grpc.loggerService.setPrefix("msg-client-service");
redis.loggerService.setPrefix("msg-client-service");
