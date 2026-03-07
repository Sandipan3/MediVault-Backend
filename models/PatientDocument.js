import mongoose from "mongoose";

const Schema = mongoose.Schema;

const patientDocumentSchema = new Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    cid: {
      type: String,
      required: true,
      unique: true,
    },

    // ZK commitment used as Merkle leaf
    commitment: {
      type: String,
      required: true,
      index: true,
    },

    filename: {
      type: String,
    },

    mimetype: {
      type: String,
    },

    size: {
      type: Number,
    },

    uploadedBy: {
      type: String,
      enum: ["patient", "doctor"],
      default: "patient",
    },
  },
  { timestamps: true },
);

export default mongoose.model("PatientDocument", patientDocumentSchema);
