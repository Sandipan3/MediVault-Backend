import ipfs from "../utils/ipfsClient.js";
import PatientDocument from "../models/PatientDocument.js";

export const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Upload to local IPFS node
    const { path: cid } = await ipfs.add(req.file.buffer);

    // Save metadata in MongoDB
    const newDoc = new PatientDocument({
      patientId: req.body.patientId,
      cid,
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      uploadedBy: req.body.uploadedBy || "patient",
    });

    await newDoc.save();

    res.status(201).json({
      message: "File uploaded successfully",
      data: {
        cid,
        filename: req.file.originalname,
        ipfsUrl: `http://127.0.0.1:8080/ipfs/${cid}`,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error uploading file" });
  }
};

export const getAllDocuments = async (req, res) => {
  try {
    const docs = await PatientDocument.find().sort({ createdAt: -1 });
    res.status(200).json({ data: docs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching documents" });
  }
};

export const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;

    const doc = await PatientDocument.findById(id);
    if (!doc) {
      return res.status(404).json({ message: "Document not found" });
    }

    try {
      await ipfs.pin.rm(doc.cid);
      console.log(`Unpinned from IPFS: ${doc.cid}`);
    } catch (err) {
      console.warn(`Failed to unpin ${doc.cid}:`, err.message);
    }

    await PatientDocument.findByIdAndDelete(id);

    res.status(200).json({
      message: "Document deleted successfully from IPFS and MongoDB",
      cid: doc.cid,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting document" });
  }
};

export const getDocumentCount = async (req, res) => {
  try {
    const count = await PatientDocument.countDocuments();
    res.status(200).json({ count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error getting document count" });
  }
};
