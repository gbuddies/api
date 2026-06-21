import express from 'express';
import cors from 'cors';
import http from 'http';
import path from 'path';
import router from './endpoints/utils/router.js';
import socket from './sockets/setup.js';
import processErr from './tools/handle_err.js';

const app = express();

app.set('trust proxy', true);

app.use(
    cors({
        origin: process.env.FRONTEND_URL
    })
);

app.use(express.json());

app.use(router);

app.use("/files", express.static(path.join(process.cwd(), "files")));

app.use(globalErrHandler);

socket(http.createServer(app));

const PORT = process.env.PORT

server.listen(5500, "0.0.0.0", () => {
    console.log("Server running on port", PORT);
});