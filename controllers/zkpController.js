import * as snarkjs from "snarkjs";
import fs from "fs";

const vKey = JSON.parse(fs.readFileSync("./circuits/verification_key.json"));

export const verifyOwnershipProof = async (req, res) => {
  try {
    const { proof, publicSignals } = req.body;

    const verified = await snarkjs.groth16.verify(vKey, publicSignals, proof);

    if (!verified) {
      return res.status(400).json({
        status: "success",
        message: "Invalid proof",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Ownership verified",
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      status: "error",
      message: "Proof verification failed",
    });
  }
};
