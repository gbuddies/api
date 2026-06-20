import express from 'express';
import cors from 'cors';
import http from 'http';
import path from 'path';

import getIP from './get_my_ip.js';
import router from './endpoints/api_utils/router_factory.js';
import socketSetup from './sockets/app_socket.js';
import { globalErrHandler } from './tools/def_error_handler.js';

const ip = getIP();
const app = express();

app.use(cors({
    origin: '*'
}));
app.use(express.json());
app.use(router);
app.use("/files", express.static(path.join(process.cwd(), "files")));
app.use(globalErrHandler);

const server = http.createServer(app);

const io = socketSetup(server);

server.listen(5500, "0.0.0.0", () => {
    console.log("Backend running on LAN");
    console.log("Running locally - http://localhost:5500");
    console.log(`Running on LAN - http://${ip}:5500`);
});