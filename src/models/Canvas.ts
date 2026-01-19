import mongoose from "mongoose";

const CanvasSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      default: "default-user", // For now, we'll use a default user
      index: true,
    },
    lines: {
      type: mongoose.Schema.Types.Mixed,
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.models.Canvas || mongoose.model("Canvas", CanvasSchema);
