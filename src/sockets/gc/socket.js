import { saveGlobalMsg } from "./global_chat.services.js";

export function globalChat(io, socket) {
    socket.join("global");

    socket.on("send_message", async ({ message_form }) => {
        const ver_user_id = socket.user.id;

        try {
            const {
                message_id,
                timestamp
            } = await saveGlobalMsg(ver_user_id, message_form);

            const ums = {
                identifiers: {
                    message_id
                },
                sender_details: {
                    sender_id: ver_user_id,
                    sender_name: socket.user_details.username,
                    sender_pfp: socket.user_details.pfp
                },
                text: message_form.text,
                files_list: message_form.files_list,
                timestamp
            }

            socket.broadcast.to("global").emit("receive_message", ums);

            socket.emit("message_emit-success", {
                ...ums,
                msg_id: message_form.msg_id
            });
        }
        catch (err) {
            console.log("Error for user", ver_user_id, err);
            socket.emit("socket_error", {
                code: (err.code || "DATABASE_ERROR"),
                msg_id: message_form.msg_id
            });
        }
    });
}