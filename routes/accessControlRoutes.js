import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import {
  checkAccess,
  grantAccess,
  revokeAccess,
} from "../controllers/accessController.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/grant", grantAccess);
router.post("/revoke", revokeAccess);
router.get("/check", checkAccess);

export default router;
