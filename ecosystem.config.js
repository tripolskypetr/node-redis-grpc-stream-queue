const dotenv = require('dotenv')
const fs = require("fs");

const readConfig = (path) => ({
    ...dotenv.parse(fs.readFileSync(path)),
    NODE_TLS_REJECT_UNAUTHORIZED: "0", 
});

const appList = [
    {
        name: "host-ws",
        exec_mode: "fork",
        instances: "1",
        autorestart: true,
        max_restarts: "5",
        cron_restart: '0 0 * * *',
        max_memory_restart: '1250M',
        script: "./apps/host-ws/build/index.mjs",
        stop_signal: "SIGINT",
        env: readConfig("./.env"),
    },
];

const serviceList = [
    {
        name: "msg-server",
        exec_mode: "fork",
        instances: "1",
        autorestart: true,
        max_restarts: "5",
        cron_restart: '0 0 * * *',
        max_memory_restart: '1250M',
        script: "./services/msg-server-service/build/index.mjs",
        stop_signal: "SIGINT",
        env: readConfig("./.env"),
    },
];

module.exports = {
    apps: [
        ...appList,
        ...serviceList,
    ],
};
