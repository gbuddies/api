import {
    ForbiddenAccess,
    InvalidData,
    MissingData
} from "../../error_classes/defined_errors.js";

export function checkGetRoomParams(req, res, next) {
    const user_id = Number(req.query.user_id);
    const last_seen_id = Number(req.query.last_seen_id);

    if (user_id !== req.requesting_user.id)
        throw new ForbiddenAccess();

    if (!user_id || (last_seen_id !== 0 && !last_seen_id))
        throw new MissingData();

    if (!Number.isInteger(user_id) || !Number.isInteger(last_seen_id))
        throw new InvalidData();

    if (last_seen_id <= 0)
        throw new InvalidData();

    req.user_id = user_id;
    req.last_seen_id = last_seen_id;

    next();
}

export function checkSearchRoomParams(req, res, next) {
    const user_id = Number(req.query.user_id);
    const last_seen_id = Number(req.query.last_seen_id);
    const search_query = req.query.search_query;

    if (user_id !== req.requesting_user.id)
        throw new ForbiddenAccess();

    if (!search_query || (last_seen_id !== 0 && !last_seen_id))
        throw new MissingData();

    if (!Number.isInteger(user_id) || !Number.isInteger(last_seen_id))
        throw new InvalidData();

    if (last_seen_id <= 0)
        throw new InvalidData();

    req.user_id = user_id;
    req.last_seen_id = last_seen_id;
    req.search_query = search_query;

    next();
}

export function checkModifyRoomParams(req, res, next) {
    const user_id = Number(req.query.user_id);
    const room_data = req.body;

    if (!user_id || user_id !== req.requesting_user.id) {
        throw new ForbiddenAccess();
    }

    if (
        !room_data.room_name
        || !room_data.room_aid
        || !room_data.room_size
        || !room_data.room_type
        || !room_data.join_pref
    ) throw new MissingData();

    if (user_id !== Number(room_data.room_aid)) {
        console.log("No from here");
        throw new ForbiddenAccess();
    }

    req.user_id = user_id;
    req.data = room_data;

    next();
}

export function checkGetARoomParams(req, res, next) {
    const user_id = Number(req.query.user_id);
    const room_id = Number(req.query.room_id);

    if (!user_id || !room_id)
        throw new MissingData();

    if (
        (!Number.isInteger(user_id) && user_id < 1)
        || (!Number.isInteger(room_id) && room_id < 1)
    ) throw new InvalidData();

    if (user_id !== req.requesting_user.id)
        throw new ForbiddenAccess();

    req.user_id = user_id;
    req.room_id = room_id;

    next();
}