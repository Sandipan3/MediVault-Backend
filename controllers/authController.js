import jwt from "jsonwebtoken";
import crypto from "crypto";
import dotenv from "dotenv";
import { SiweMessage } from "siwe"; //npm install siwe@2.1.4
import User from "../models/User.js";

dotenv.config();

/* REGISTER */
export const register = async (req, res) => {
  try {
    const { name, walletAddress, role } = req.body;

    if (!name || !walletAddress) {
      return res.status(400).json({
        status: "error",
        message: "Name and walletAddress are required",
      });
    }

    const existingUser = await User.findOne({
      walletAddress,
    });

    if (existingUser) {
      return res.status(400).json({
        status: "error",
        message: "User already registered. Please login.",
      });
    }

    const nonce = crypto.randomBytes(32).toString("hex");

    const user = await User.create({
      name,
      walletAddress,
      role: role ? role.toLowerCase() : "patient",
      nonce,
    });

    return res.status(201).json({
      status: "success",
      message: "User registered successfully",
      data: {
        user: {
          _id: user._id,
          name: user.name,
          walletAddress: user.walletAddress,
          role: user.role,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

/* GET NONCE */
export const getNonce = async (req, res) => {
  try {
    let { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({
        message: "Wallet address is required",
      });
    }

    const user = await User.findOne({ walletAddress });

    if (!user) {
      return res.status(404).json({
        message: "User not registered",
      });
    }

    return res.status(200).json({
      nonce: user.nonce,
      domain: process.env.SIWE_DOMAIN,
      uri: process.env.SIWE_URI,
      chainId: Number(process.env.SIWE_CHAIN_ID),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

/* LOGIN */
export const login = async (req, res) => {
  try {
    const { message, signature } = req.body;

    if (!message || !signature) {
      return res.status(400).json({
        status: "error",
        message: "Missing message or signature",
      });
    }

    const siweMessage = new SiweMessage(message);
    const fields = await siweMessage.verify({ signature });

    const walletAddress = fields.data.address;
    console.log(walletAddress);

    const user = await User.findOne({ walletAddress });

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found. Please register first.",
      });
    }

    if (fields.data.nonce !== user.nonce) {
      return res.status(401).json({
        status: "error",
        message: "Invalid nonce",
      });
    }

    if (fields.data.domain !== process.env.SIWE_DOMAIN) {
      return res.status(401).json({
        status: "error",
        message: "Invalid domain",
      });
    }

    if (fields.data.uri !== process.env.SIWE_URI) {
      return res.status(401).json({
        status: "error",
        message: "Invalid URI",
      });
    }

    if (
      process.env.SIWE_CHAIN_ID &&
      fields.data.chainId !== Number(process.env.SIWE_CHAIN_ID)
    ) {
      return res.status(401).json({
        status: "error",
        message: "Invalid chain",
      });
    }

    user.nonce = crypto.randomBytes(32).toString("hex");
    await user.save();

    const token = jwt.sign(
      {
        id: user._id,
        walletAddress: user.walletAddress,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    return res.status(200).json({
      status: "success",
      message: "Login successful",
      data: {
        token,
        user: {
          _id: user._id,
          name: user.name,
          walletAddress: user.walletAddress,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error("SIWE login error:", error);
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

/* GET USER */
export const getUserByWallet = async (req, res) => {
  try {
    const walletAddress = req.params.walletAddress;

    if (!walletAddress) {
      return res.status(400).json({
        status: "error",
        message: "Wallet address is required",
      });
    }

    const user = await User.findOne({ walletAddress });

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    return res.status(200).json({
      status: "success",
      data: user,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};
