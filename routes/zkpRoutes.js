import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { verifyOwnershipProof } from "../controllers/zkpController.js";
import { getMerklePath } from "../zk/merkleTree.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/path/:documentId", getMerklePath);

router.post("/verify", verifyOwnershipProof);

export default router;
