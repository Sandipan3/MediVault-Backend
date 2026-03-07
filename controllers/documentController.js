import ipfs from "../utils/ipfsClient.js";
import PatientDocument from "../models/PatientDocument.js";
import crypto from "crypto";
import { buildPoseidon } from "circomlibjs";
import { ethers } from "ethers";

const SNARK_FIELD = BigInt(
  "21888242871839275222246405745257275088548364400416034343698204186575808495617",
);

let poseidon;

(async () => {
  poseidon = await buildPoseidon();
})();

export const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ status: "error", message: "No file uploaded" });
    }

    if (!poseidon) {
      return res
        .status(500)
        .json({ status: "error", message: "Poseidon not initialized yet" });
    }

    // Upload file to IPFS
    const { path: cid } = await ipfs.add(req.file.buffer);

    // Hash CID
    const cidHashHex = ethers.keccak256(ethers.toUtf8Bytes(cid));
    const cidHash = BigInt(cidHashHex) % SNARK_FIELD;

    // Generate patient secret
    const secret = BigInt("0x" + crypto.randomBytes(31).toString("hex"));

    // Generate commitment
    const commitment = poseidon.F.toString(poseidon([secret, cidHash]));

    // Save document
    const newDoc = new PatientDocument({
      patientId: req.body.patientId,
      cid,
      commitment,
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      uploadedBy: req.body.uploadedBy || "patient",
    });

    await newDoc.save();

    res.status(201).json({
      status: "success",
      message: "File uploaded successfully",
      data: {
        cid,
        commitment,
        secret: secret.toString(),
        ipfsUrl: `http://127.0.0.1:8080/ipfs/${cid}`,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "error",
      message: "Error uploading file",
    });
  }
};
export const getAllDocuments = async (req, res) => {
  try {
    const docs = await PatientDocument.find().sort({ createdAt: -1 });
    res.status(200).json({ status: "success", data: docs });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ status: "error", message: "Error fetching documents" });
  }
};

export const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;

    const doc = await PatientDocument.findById(id);
    if (!doc) {
      return res
        .status(404)
        .json({ status: "error", message: "Document not found" });
    }

    try {
      await ipfs.pin.rm(doc.cid);
      console.log(`Unpinned from IPFS: ${doc.cid}`);
    } catch (err) {
      console.warn(`Failed to unpin ${doc.cid}:`, err.message);
    }

    await PatientDocument.findByIdAndDelete(id);

    res.status(200).json({
      status: "success",
      message: "Document deleted successfully from IPFS and MongoDB",
      cid: doc.cid,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ status: "error", message: "Error deleting document" });
  }
};

export const getDocumentCount = async (req, res) => {
  try {
    const count = await PatientDocument.countDocuments();
    res.status(200).json({ status: "success", count });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ status: "error", message: "Error getting document count" });
  }
};

export const getDocumentsByUserID = async (req, res) => {
  try {
    const { userId } = req.params;

    const docs = await PatientDocument.find({ patientId: userId }).sort({
      createdAt: -1,
    });

    if (!docs || docs.length === 0) {
      return res.status(200).json({
        status: "success",
        data: [],
        message: "No documents found for this user",
      });
    }

    res.status(200).json({
      status: "success",
      count: docs.length,
      data: docs,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "error",
      message: "Error fetching user documents",
    });
  }
};
