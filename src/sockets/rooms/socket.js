import { isRoomMember, saveRoomMessage } from "./room_chat.services.js"

export function roomChat(io, socket) {
    socket.on("join-room", async ({ room_id }) => {
        try {
            const is_room_member = await isRoomMember(room_id, socket.user.id);

            if (is_room_member)
                socket.join(room_id);
        }
        catch (err) {
            socket.emit("socket_error", { code: (err.code || "DATABASE_ERROR") });
        }
    });

    socket.on("leave-room", async ({ room_id }) => {
        try {
            socket.leave(room_id);
        }
        catch (err) {
            socket.emit("socket_error", { code: (err.code || "DATABASE_ERROR") });
        }
    });

    socket.on("send-room-message", async ({ message_form, room_id }) => {
        try {
            const {
                message_id,
                timestamp
            } = await saveRoomMessage(room_id, socket.user.id, message_form);

            const ums = {
                identifiers: {
                    message_id,
                    room_id
                },
                sender_details: {
                    sender_id: socket.user.id,
                    sender_name: socket.user_details.username,
                    sender_pfp: socket.user_details.pfp
                },
                text: message_form.text,
                files_list: message_form.files_list,
                timestamp
            }

            socket.to(room_id).emit("get-room-message", ums);

            socket.emit("room_message_emit-success", {
                ...ums,
                msg_id: message_form.msg_id
            });
        }
        catch (err) {
            console.log("Error for user", socket.user.id, err);
            socket.emit("socket_error", {
                code: (err.code || "DATABASE_ERROR"),
                msg_id: message_form.msg_id
            });
        }
    });
}