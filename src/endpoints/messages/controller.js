import {
    createContact,
    getChats,
    getContacts,
    getGlobalChats,
    getRoomMessages,
    searchContacts
} from "./messages.services.js";

export async function handleGetGlobalChats(req, res, next) {
    const user_id = req.requesting_user.id;
    const offset = req.offset;

    try {
        const chats = await getGlobalChats(user_id, offset);

        res.status(201).json({
            success: true,
            chats
        });
    }
    catch (err) {
        next(err);
    }
}

export async function handleGetRoomMessages(req, res, next) {
    const user_id = req.user_id;
    const room_id = req.room_id;
    const last_seen = req.last_seen;

    try {
        const messages = await getRoomMessages(user_id, room_id, last_seen);

        res.status(201).json({
            success: true,
            messages
        });
    }
    catch (err) {
        next(err);
    }
}

export async function handleGetContacts(req, res, next) {
    const user_id = req.user_id;

    try {
        const contacts = await getContacts(user_id);

        res.status(201).json({
            success: true,
            contacts
        });
    }
    catch (err) {
        next(err);
    }
}

export async function handleGetChats(req, res, next) {
    const user_id = req.user_id;
    const last_seen_id = req.last_seen;
    const contact_id = req.contact_id;

    try {
        const chats = await getChats(user_id, contact_id, last_seen_id);

        res.status(201).json({
            success: true,
            chats
        });
    }
    catch (err) {
        next(err);
    }
}

export async function handleSearchContacts(req, res, next) {
    const user_id = req.user_id;
    const query = req.search_query;
    const last_seen = req.last_seen;

    try {
        const contacts = await searchContacts(user_id, last_seen, query);

        res.status(201).json({
            success: true,
            contacts
        });
    }
    catch (err) {
        next(err);
    }
}

export async function handleCreateContact(req, res, next) {
    const user_id = req.user_id;
    const friend_id = req.friend_id;

    try {
        const contact_details = await createContact(user_id, friend_id);

        res.status(201).json({
            success: true,
            contact_details
        });
    }
    catch (err) {
        next(err);
    }
}