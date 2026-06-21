import { Router } from "express";

import { 
    checkFrndReqParams,
    checkSearchUserParams, 
    checkUserId, 
    chkRemoveFrndData
} from "./users.middleware.js";

import { 
    handleTransacFrndReqs,
    handleGetUser, 
    handleSaveDetails, 
    handleSearchUser,
    handleGetSentFrndReqs,
    handleGetFrnds,
    handleRemoveFrnd,
    handleGetRecFrndReqs,
    handleGetRecentFrnds,
    handleSearchFriend
} from "./users.controller.js";

import { authorizeToken } from "../auth/middleware.js";
import { upload } from "../utils/storage.js";

const user_router = Router();

user_router.get(
    "/get-user", 
    authorizeToken, 
    checkUserId, 
    handleGetUser
);

user_router.post(
    "/save-details", 
    authorizeToken,
    upload.single("pfp"), 
    checkUserId,
    handleSaveDetails
);

user_router.get(
    "/search",
    authorizeToken,
    checkSearchUserParams,
    handleSearchUser
)

user_router.get(
    "/search/friends",
    authorizeToken,
    checkSearchUserParams,
    handleSearchFriend
)

user_router.post(
    "/requests",
    authorizeToken,
    checkFrndReqParams,
    handleTransacFrndReqs
)

user_router.get(
    "/requests/sent",
    authorizeToken,
    checkUserId,
    handleGetSentFrndReqs
)

user_router.get(
    "/requests/received",
    authorizeToken,
    checkUserId,
    handleGetRecFrndReqs
)

user_router.get(
    "/friends",
    authorizeToken,
    checkUserId,
    handleGetFrnds
)

user_router.post(
    "/friends/remove",
    authorizeToken,
    checkUserId,
    chkRemoveFrndData,
    handleRemoveFrnd
)

user_router.get(
    "/recent-friends",
    authorizeToken,
    checkUserId,
    handleGetRecentFrnds
);

export default user_router;