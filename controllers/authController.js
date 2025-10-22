import jwt from "jsonwebtoken";
import crypto from "crypto";
import dotenv from "dotenv";
import { ethers } from "ethers";
import User from "../models/User.js";

dotenv.config();

export const register = async (req, res) => {
  try {
    const { name, walletAddress, role } = req.body;

    if (!name || !walletAddress) {
      return res.status(400).json({
        status: "error",
        message: "Name and walletAddress are required",
      });
    }

    const normalizedAddress = walletAddress.toLowerCase();
    const existingUser = await User.findOne({
      walletAddress: normalizedAddress,
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
      walletAddress: normalizedAddress,
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

export const getNonce = async (req, res) => {
  try {
    let { walletAddress } = req.body;
    if (!walletAddress) {
      return res.status(400).json({ message: "Wallet address is required" });
    }

    walletAddress = walletAddress.toLowerCase();

    let user = await User.findOne({ walletAddress });
    if (!user) {
      user = await User.create({
        walletAddress,
        nonce: crypto.randomBytes(32).toString("hex"),
      });
    }

    return res.status(200).json({ nonce: user.nonce });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

export const login = async (req, res) => {
  try {
    const { walletAddress, signature } = req.body;

    if (!walletAddress || !signature) {
      return res.status(400).json({
        status: "error",
        message: "Missing walletAddress or signature",
      });
    }

    const normalizedAddress = walletAddress.toLowerCase();
    const user = await User.findOne({ walletAddress: normalizedAddress });

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found. Please register first.",
      });
    }

    const message = `Sign this nonce: ${user.nonce}`;
    const recovered = ethers.verifyMessage(message, signature);

    if (recovered.toLowerCase() !== normalizedAddress) {
      return res.status(401).json({
        status: "error",
        message: "Signature verification failed",
      });
    }

    // Refresh nonce for next login
    user.nonce = crypto.randomBytes(32).toString("hex");
    await user.save();

    const token = jwt.sign(
      {
        id: user._id,
        walletAddress: user.walletAddress,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
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
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

export const getUserByWallet = async (req, res) => {
  try {
    const walletAddress = req.params.walletAddress?.toLowerCase();

    if (!walletAddress) {
      return res.status(400).json({
        status: "error",

        message: "Wallet address is required",
      });
    }
    const user = await User.findOne({ walletAddress: walletAddress });

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
