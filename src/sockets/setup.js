import { Server } from 'socket.io';
import jwt from "jsonwebtoken";

import {
    InvalidJWT, 
    UnAuthorized 
} from '../error_classes/defined_errors.js';

import { getUser } from '../endpoints/users/users.services.js';
import { globalChat } from './gc/global_chat.socket.js';
import { roomChat } from './rooms/room_chat.socket.js';
import { DM } from './dms/dm_socket.socket.js';

export const user_socket_map = new Map();

export default function socket(server) {
    const io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL,
        }
    });

    io.use((socket, next) => {
        const token = socket.handshake.auth.token;

        if (!token) {
            return next(new UnAuthorized());
        }

        try {
            const user = jwt.verify(token, process.env.JWT_SECRET);
            socket.user = user;
            next();
        }
        catch (err) {
            next(new InvalidJWT());
        }
    });

    io.on("connection", async (socket) => {

        try {
            socket.user_details = await getUser(socket.user.id, socket.user.id);
        }
        catch (err) {
            socket.emit("socket_error", { code: "FORBIDDEN_ACCESS" });
        }

        globalChat(io, socket);
        roomChat(io, socket);
        DM(io, socket);

        socket.on("disconnect", () => {
            user_socket_map.delete(socket.user.id);
        });
    });

    return io;
}