import { Router } from "express";
import { verifyOtp } from "./controller.js";
import { sendOtp } from "./controller.js";

import { 
    handleUserLogin, 
    handleUserReg 
} from "./controller.js";

import { 
    authorizeToken,
    validateLoginUser, 
    validateRegUser 
} from "./middleware.js";

const auth_router = Router();

auth_router.post("/signup", validateRegUser, handleUserReg);

auth_router.post("/signin", validateLoginUser, handleUserLogin);

auth_router.post("/verify-otp", authorizeToken, verifyOtp);

auth_router.post("/send-otp", authorizeToken, sendOtp);

export default auth_router;