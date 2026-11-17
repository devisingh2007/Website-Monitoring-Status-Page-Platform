
import mongoose, { Model, Schema, Types } from "mongoose";

export interface IncidentHistoryLook {
  incidentId: Types.ObjectId;
  message: string;
  status?: "investigating"| "identified"| "monitoring"| "resolved"| null;
  createdAt: Date;
  updatedAt: Date;
}

const IncidentHistorySchema = new Schema<IncidentHistoryLook>(
  {
    incidentId: {
      type: Schema.Types.ObjectId,
      ref: "Incident",
      required: [true, "Incident ID is required"],
      index: true,
    },

    message: {
      type: String,
      required: [true, "Update message is required"],
      trim: true,
      minlength: [3, "Message must be at least 3 characters"],
      maxlength: [1000, "Message cannot exceed 1000 characters"],
    },

    status: {
      type: String,
      enum: [
        "investigating",
        "identified",
        "monitoring",
        "resolved",
      ],
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

IncidentHistorySchema.index({
  incidentId: 1,
  createdAt: 1,
});

const IncidentHistory: Model<IncidentHistoryLook> =
  mongoose.models.IncidentHistory ||
  mongoose.model<IncidentHistoryLook>(
    "IncidentHistory",
    IncidentHistorySchema
  );

export default IncidentHistory;
