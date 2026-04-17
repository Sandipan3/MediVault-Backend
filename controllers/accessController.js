import { ethers } from "ethers";
import dotenv from "dotenv";
dotenv.config();

const abi = [
  "function grantAccess(address _doctor) external",
  "function revokeAccess(address _doctor) external",
  "function checkAccess(address _patient, address _doctor) external view returns (bool)",
];

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, abi, wallet);

export const grantAccess = async (req, res) => {
  try {
    const { doctor } = req.body;
    const tx = await contract.grantAccess(doctor);
    await tx.wait();
    res.status(200).json({ status: "success", txHash: tx.hash });
  } catch (error) {
    res.status(500).json({ status: "error", error: error.message });
  }
};

export const revokeAccess = async (req, res) => {
  try {
    const { doctor } = req.body;
    const tx = await contract.revokeAccess(doctor);
    await tx.wait();
    res.status(200).json({ status: "success", txHash: tx.hash });
  } catch (error) {
    res.status(500).json({ status: "error", error: error.message });
  }
};

export const checkAccess = async (req, res) => {
  try {
    const { patient, doctor } = req.query;
    const hasAccess = await contract.checkAccess(patient, doctor);
    res.status(200).json({ status: "success", hasAccess });
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: "error", error: error.message });
  }
};
