import express from "express";
import {
  register,
  getNonce,
  login,
  getUserByWallet,
} from "../controllers/authController.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/nonce", getNonce);
router.get("/user/:walletAddress", getUserByWallet);

export default router;
