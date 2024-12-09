# 🔥 node-grpc-stream-queue

> Enables reliable bidirectional gRPC streaming with automatic retries, message queuing, error handling, and logging, supporting real-time communication between distributed services in a robust and fault-tolerant manner.

![screencast](./screencast.gif)

## Test case 1: console-grpc-streaming

> Console apps which stream events to each other through gRPC

**Setup**

```bash
npm install
npm run build
```

**Running**

```bash
npm run start:msg-client
npm run start:msg-server
```

## Test case 2: sse-grpc-streaming

> HTTP/2 Server-Sent Events frontend app which recieves messages from gRPC service

**Setup**

```bash
npm install
npm run build
mkdir ssl
cd ssl
mkcert localhost # choco install mkcert
```

**Running**

```bash
npm run start:msg-server
npm run start:host-sse
npx -y open-cli https://localhost
```

## Test case 3 ws-grpc-streaming

> WebSocket frontend app which recieves messages from gRPC service

**Setup**

```bash
npm install
npm run build
```

**Running**

```bash
npm run start:msg-server
npm run start:host-ws
npx -y open-cli http://localhost
```
