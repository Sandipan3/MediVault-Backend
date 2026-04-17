import express from "express";
import {
  getAllTransactions,
  getTransactionDetails,
} from "../controllers/adminController.js";

const router = express.Router();

router.get("/transactions", getAllTransactions);
router.get("/transactions/:hash", getTransactionDetails);

export default router;
