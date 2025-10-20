import express from "express";
import { register, getNonce, login } from "../controllers/authController.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/nonce", getNonce);

export default router;
