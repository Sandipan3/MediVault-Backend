import express from "express";
import {
  uploadDocument,
  getAllDocuments,
  deleteDocument,
  getDocumentCount,
  getDocumentsByUserID,
} from "../controllers/documentController.js";
import uploadMiddleware from "../middlewares/uploadMiddleware.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/upload", uploadMiddleware, uploadDocument);
router.get("/", getAllDocuments);
router.get("/document-count", getDocumentCount);
router.delete("/:id", deleteDocument);
router.get("/documents/user/:userId", getDocumentsByUserID);

export default router;
