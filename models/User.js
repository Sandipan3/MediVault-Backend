import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
    },
    walletAddress: {
      type: String,
      required: true,
      unique: true,
    },
    role: {
      type: String,
      enum: ["doctor", "patient", "admin"],
      default: "patient",
      lowercase: true,
    },
    nonce: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

const User = mongoose.model("User", userSchema);
export default User;
