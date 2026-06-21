import { isContact, saveDM } from "./dm_socket.services.js"

export function DM(io, socket) {

    socket.on("connect-dm", async ({ contact_id }) => {
        try {
            const is_contact = await isContact(contact_id, socket.user.id);

            if (is_contact)
                socket.join(contact_id);
        }
        catch (err){
            socket.emit("socket_error", { code: (err.code || "DATABASE_ERROR") });
        }
    });

    socket.on("disconnect-dm", async ({ contact_id }) => {
        try{
            socket.leave(contact_id);
        }
        catch (err){
            socket.emit("socket_error", { code: (err.code || "DATABASE_ERROR") });
        }
    });

    socket.on("send-dm", async ({ message_form, contact_id }) => {
        try{
            const {
                message_id,
                timestamp
            } = await saveDM(contact_id, socket.user.id, message_form);

            const ums = {
                identifiers: {
                    message_id,
                    contact_id
                },
                sender_details: {
                    sender_id: socket.user.id,
                    sender_name: socket.user_details.username,
                    sender_pfp: socket.user_details.pfp
                },
                text: message_form.text,
                files_list: message_form.files_list,
                timestamp
            };

            socket.to(contact_id).emit("get-dm", ums);
            socket.emit("dm_emit-success", {
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