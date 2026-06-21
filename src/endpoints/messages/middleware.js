import {
    ForbiddenAccess,
    InvalidData,
    MissingData
} from "../../error_classes/defined_errors.js";

export function checkOffset(req, res, next) {
    const offset = Number(req.query.offset);

    if (!offset && offset !== 0) {
        throw new InvalidData();
    }

    if (!Number.isInteger(offset) || offset < 0) {
        throw new InvalidData();
    }

    req.offset = offset;

    next();
}

export function checkGetRoomMsgsParams(req, res, next) {
    const user_id = Number(req.query.user_id);
    const room_id = Number(req.query.room_id);
    const last_seen = Number(req.query.last_seen_msg);

    if (!user_id || !room_id || !last_seen)
        throw new MissingData();

    if (
        (!Number.isInteger(user_id) && user_id < 1)
        || (!Number.isInteger(room_id) && room_id < 1)
        || (!Number.isInteger(last_seen) && last_seen < 1)
    ) throw new InvalidData();

    if (user_id !== req.requesting_user.id)
        throw new ForbiddenAccess();

    req.user_id = user_id;
    req.room_id = room_id;
    req.last_seen = last_seen;

    next();
}

export function checkGetChatParams(req, res, next) {
    const user_id = Number(req.query.user_id);
    const contact_id = Number(req.query.contact_id);
    const last_seen = Number(req.query.last_seen_id);

    if (!user_id || !contact_id || !last_seen) {
        throw new MissingData();
    }

    if (
        (!Number.isInteger(user_id) && user_id < 1)
        || (!Number.isInteger(contact_id) && contact_id < 1)
        || (!Number.isInteger(last_seen) && last_seen < 1)
    ) {
        throw new InvalidData();
    }

    if (user_id !== req.requesting_user.id){
        throw new ForbiddenAccess();
    }

    req.user_id = user_id;
    req.contact_id = contact_id;
    req.last_seen = last_seen;

    next();
}

export function checkSearchContactParams(req, res, next) {
    const user_id = Number(req.query.user_id);
    const query = req.query.query;
    const last_seen = Number(req.query.last_seen_id);

    if (user_id !== req.requesting_user.id)
        throw new ForbiddenAccess();

    if (!query || !last_seen)
        throw new InvalidData();

    req.user_id = user_id;
    req.search_query = query;
    req.last_seen = last_seen;

    next();
}

export function checkCreateContactParams(req, res, next) {
    const user_id = Number(req.query.user_id);
    const friend_id = Number(req.query.friend_id);

    if (!user_id || !friend_id)
        throw new MissingData();

    if (user_id !== req.requesting_user.id)
        throw new ForbiddenAccess();
    
    req.user_id = user_id;
    req.friend_id = friend_id;

    next();
}