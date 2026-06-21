import { Router } from "express";
import { authorizeToken } from "../auth/middleware.js";

import {
    createWriter,
    getAllWriters,
    handleGetAWriter,
    handleUpdateWriter,
    handleWriterAvailability
} from "./orders.controller.js";

import {
    validateCre_writerMemo,
    verifyWriter
} from "./orders.middleware.js";
import { checkUserId } from "../users/users.middleware.js";

const orders_router = Router();

orders_router.post(
    "/writer/create",
    authorizeToken,
    validateCre_writerMemo,
    createWriter
);

orders_router.post(
    "/writer/update",
    authorizeToken,
    validateCre_writerMemo,
    handleUpdateWriter
);

// are error handling chei ra...
// error classes use chei
orders_router.get(
    "/writer/all",
    authorizeToken,
    checkUserId,
    getAllWriters
);

// Don't create another api if u ever needed to get a single user info.
// reuse this.
orders_router.get(
    "/writer/get",
    authorizeToken,
    verifyWriter,
    handleGetAWriter
);

orders_router.post(
    "/writer/available",
    authorizeToken,
    verifyWriter,
    handleWriterAvailability
);

export default orders_router;