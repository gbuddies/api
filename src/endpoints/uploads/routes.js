import { Router } from "express";
import { authorizeToken } from "../auth/middleware.js";
import { upload } from "../utils/storage.js";
import { handleFIles } from "./files.controller.js";
import { verifyUploadingUser } from "./files.middleware.js";

const file_router = Router();

file_router.post(
    "/upload",
    authorizeToken,
    verifyUploadingUser,
    upload.array("files"),
    handleFIles
);

export default file_router;