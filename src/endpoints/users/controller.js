import { 
    ForbiddenAccess, 
    InvalidData, 
    MissingData
} from "../../error_classes/defined_errors.js";

import { 
    acceptFrndReq, 
    getFriends, 
    getRecentFriends, 
    getRecFrndReqs, 
    getSentFrndReqs, 
    getUser, 
    rejectFrndReq, 
    removeFriend, 
    saveUserDetails, 
    searchFriends, 
    searchUsers, 
    sendFrndReq 
} from "./users.services.js";

export async function handleGetUser(req, res, next){
    const user_id = Number(req.user_id);
    const req_user_id = Number(req.query.req_user_id);

    if (!req_user_id)
        throw new MissingData();

    if (!Number.isInteger(req_user_id))
        throw new InvalidData();

    try{
        const user = await getUser(user_id, req_user_id);

        res.status(201).json({
            success: true,
            user
        });
    }
    catch (err){
        next(err);
    }
}

export async function handleSaveDetails(req, res, next){
    const user_id = Number(req.user_id);

    try{
        req.body.pfp = req.file?.filename || req.body.pfp || null;
        const data = req.body;

        if (!data || data.length < 6)
            throw new InvalidData();

        if (await saveUserDetails(user_id, data)){
            res.status(201).json({
                success: true
            });
        }
    }
    catch (err){
        next(err);
    }
}

export async function handleSearchUser(req, res, next){
    const user_id = Number(req.user_id);
    const search_query = req.search_query;

    try{
        const users = await searchUsers(user_id, search_query);

        res.status(201).json({
            success: true,
            users
        });
    }
    catch (err){
        next(err);
    }
}

export async function handleSearchFriend(req, res, next){
    const user_id = Number(req.user_id);
    const search_query = req.search_query;
    const last_seen_id = Number(req.last_seen_id);

    try{
        const search_res = await searchFriends(user_id, search_query, last_seen_id);

        res.status(201).json({
            success: true,
            search_res
        });
    }
    catch (err){
        next(err);
    }
}

export async function handleTransacFrndReqs(req, res, next){
    const user_id = Number(req.user_id);
    const data = req.data;
    const action = req.action;

    try{
        let response;

        switch (action){
            case "send":
                response = await sendFrndReq(data.senderId, data.receiverId);
                
                break;

            case "accept":
                response = await acceptFrndReq(data.requestId, data.userId);

                break;

            case "reject":
                response = await rejectFrndReq(data.requestId, data.userId);

                break;
        }

        res.status(201).json({
            success: true,
            response
        });
    }
    catch (err){
        next(err);
    }
}

export async function handleGetSentFrndReqs(req, res, next){
    const user_id = Number(req.user_id);

    try{
        const sent_reqs = await getSentFrndReqs(user_id);

        res.status(201).json({
            success: true,
            sent_reqs
        });
    }
    catch (err){
        next(err);
    }
}

export async function handleGetRecFrndReqs(req, res, next){
    const user_id = Number(req.user_id);

    try{
        const rec_reqs = await getRecFrndReqs(user_id);

        res.status(201).json({
            success: true,
            rec_reqs
        });
    }
    catch (err){
        next(err);
    }
}

export async function handleGetFrnds(req, res, next){
    const user_id = req.user_id;

    try{
        const friends = await getFriends(user_id);

        res.status(201).json({
            success: true,
            friends
        });
    }
    catch (err){
        next(err);
    }
}

export async function handleRemoveFrnd(req, res, next){
    const data = req.data;

    try{
        await removeFriend(data.friendId, data.userId);

        res.status(201).json({
            success: true
        });
    }
    catch (err){
        next(err);
    }
}

export async function handleGetRecentFrnds(req, res, next){
    const user_id = req.user_id;

    try{
        const recents = await getRecentFriends(user_id);

        res.status(201).json({
            success: true,
            recents
        });
    }
    catch (err){
        next(err);
    }
}