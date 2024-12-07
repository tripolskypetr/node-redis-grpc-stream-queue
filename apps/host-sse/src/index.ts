import { Hono } from 'hono'

import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'

import http2 from 'http2'
import fs from "fs";

import sse from './routes/sse';

const app = new Hono();

app.route('/api/v1/realtime/sse', sse);

app.use('/*', serveStatic({ root: './public/sse' }))

serve({
  fetch: app.fetch,
  createServer: http2.createSecureServer,
  serverOptions: {
    key: fs.readFileSync("./ssl/localhost-key.pem"),
    cert: fs.readFileSync("./ssl/localhost.pem"),
  },
  port: 443,
});

console.log("Server listening on https://localhost:443");
