import express from "express";
import {
  uploadDocument,
  getAllDocuments,
  deleteDocument,
  getDocumentCount,
} from "../controllers/documentController.js";
import uploadMiddleware from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.post("/upload", uploadMiddleware, uploadDocument);
router.get("/", getAllDocuments);
router.get("/document-count", getDocumentCount);
router.delete("/:id", deleteDocument);

export default router;
