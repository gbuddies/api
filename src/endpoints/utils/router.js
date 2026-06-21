import { Router } from "express";
import auth_router from "../auth/routes.js" ;
import user_router from "../users/routes.js";
import msg_router from "../messages/routes.js";
import rooms_router from "../rooms/routes.js";
import file_router from "../uploads/routes.js";
import orders_router from "../orders/routes.js";

const router = Router();

router.get(
    "/ping",
    (req, res) => {
        res.json({
            status: true
        });
    }
);

router.use("/auth", auth_router);

router.use("/users", user_router);

router.use("/messages", msg_router);

router.use("/rooms", rooms_router);

router.use("/files", file_router);

router.use("/orders", orders_router);

export default router;