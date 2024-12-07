# 🔥 node-grpc-stream-queue

> Enables reliable bidirectional gRPC streaming with automatic retries, message queuing, error handling, and logging, supporting real-time communication between distributed services in a robust and fault-tolerant manner.

![screencast](./screencast.gif)

## Test case 1: console-grpc-streaming

> Console apps which stream events to each other through gRPC

**Setup**

No setup required

**Running**

```bash
npm install
npm run build
node ./services/msg-client-service/build/index.mjs
node ./services/msg-server-service/build/index.mjs
```

## Test case 2: sse-grpc-streaming

> HTTP/2 Server-Sent Events frontend app which recieves messages from gRPC service

**Setup**
```bash
npm install
npm run build
cd ./apps/host-sse/ssl
mkcert localhost # choco install mkcert
```

**Running**

```bash
node ./apps/host-sse/build/index.mjs
npx-y open-cli https://localhost
```
