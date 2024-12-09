import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { grpc } from "@modules/remote-grpc";
import { redis } from "@modules/remote-redis";

import "./routes/ws";

import { app, injectWebSocket } from './config/app';

app.use('/*', serveStatic({ root: './public/ws' }))

const server = serve({
  fetch: app.fetch,
  port: 80,
});

injectWebSocket(server)

console.log("Server listening on http://localhost:80");

redis.loggerService.setPrefix("host-ws");
grpc.loggerService.setPrefix("host-ws");
