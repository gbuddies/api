import {
    ForbiddenAccess,
    InvalidData,
    MissingData
} from "../../error_classes/defined_errors.js";

export function checkUserId(req, res, next) {
    const user_id = Number(req.query.user_id);

    if (!user_id)
        throw new MissingData();

    if (user_id !== Number(req.requesting_user.id))
        throw new ForbiddenAccess();

    if (!Number.isInteger(user_id) || user_id < 1)
        throw new InvalidData();

    req.user_id = user_id;

    next();
}

export function checkSearchUserParams(req, res, next) {
    const user_id = Number(req.query.user_id);
    const last_seen_id = Number(req.query.last_seen_id);
    const query = req.query.query;

    if (!user_id || !query || !last_seen_id)
        throw new MissingData();

    if (user_id !== Number(req.requesting_user.id))
        throw new ForbiddenAccess();

    if (!Number.isInteger(user_id))
        throw new InvalidData();

    req.user_id = user_id;
    req.search_query = query;
    req.last_seen_id = last_seen_id;

    next();
}

export function checkFrndReqParams(req, res, next) {
    const user_id = Number(req.query.user_id);
    const action = req.query.action;
    const data = req.body;

    if (!user_id || !action || !data)
        throw new MissingData();

    if (user_id !== req.requesting_user.id)
        throw new ForbiddenAccess();

    if (!Number.isInteger(user_id))
        throw new InvalidData();

    // Check respective data
    switch (action) {
        case "send":
            if (!data.senderId || !data.receiverId)
                throw new MissingData();

            if (data.senderId < 1 || data.receiverId < 1)
                throw new InvalidData();

            if (data.senderId != user_id)
                throw new ForbiddenAccess();

            break;

        case "accept":
        case "reject":
            data.requestId = Number(data.requestId);
            data.userId = Number(data.userId);

            if (!data.requestId || !data.userId)
                throw new MissingData();

            if (!Number.isInteger(data.requestId) || !Number.isInteger(data.userId))
                throw new InvalidData();

            if (data.requestId < 1 || data.userId < 1)
                throw new InvalidData();

            if (data.userId !== user_id)
                throw new ForbiddenAccess();

            break;
    }

    req.user_id = user_id;
    req.data = data;
    req.action = action;

    next();
}

export function chkRemoveFrndData(req, res, next) {
    const user_id = req.user_id;
    const data = req.body;

    if (!data && (!data.userId || !data.friendId))
        throw new MissingData();

    if (Number(data.userId) !== user_id)
        throw new ForbiddenAccess();

    req.data = data;

    next();
}