import { Router } from "express";
import { authorizeToken } from "../auth/middleware.js";

import { 
    checkGetARoomParams,
    checkGetRoomParams, 
    checkModifyRoomParams, 
    checkSearchRoomParams 
} from "./rooms.middleware.js";

import { 
    checkMembership,
    handleGetAllRooms, 
    handleGetARoom, 
    handleGetMyRooms, 
    handleGetRoomMembers, 
    handleJoinRoom, 
    handleLeaveRoom, 
    handleCreateRooms, 
    handleSearchRooms,
    handleUpdateRooms
} from "./rooms.controller.js";

import { upload } from "../utils/storage.js";

const rooms_router = Router();

rooms_router.get(
    "/is_member",
    authorizeToken,
    checkGetARoomParams,
    checkMembership
);

rooms_router.get(
    "/my-rooms", 
    authorizeToken, 
    checkGetRoomParams,
    handleGetMyRooms
);

rooms_router.get(
    "/all-rooms",
    authorizeToken,
    checkGetRoomParams,
    handleGetAllRooms
);

rooms_router.get(
    "/get-room",
    authorizeToken,
    checkGetARoomParams,
    handleGetARoom
);

rooms_router.get(
    "/members",
    authorizeToken,
    checkGetARoomParams,
    handleGetRoomMembers
);

rooms_router.get(
    "/search",
    authorizeToken,
    checkSearchRoomParams,
    handleSearchRooms
);

rooms_router.post(
    "/create",
    authorizeToken,
    upload.single("room_icon"),
    checkModifyRoomParams,
    handleCreateRooms
);

rooms_router.post(
    "/update",
    authorizeToken,
    upload.single("room_icon"),
    checkGetARoomParams,
    handleUpdateRooms
);

rooms_router.get(
    "/join",
    authorizeToken,
    checkGetARoomParams,
    handleJoinRoom
);

rooms_router.get(
    "/leave",
    authorizeToken,
    checkGetARoomParams,
    handleLeaveRoom
);

export default rooms_router;