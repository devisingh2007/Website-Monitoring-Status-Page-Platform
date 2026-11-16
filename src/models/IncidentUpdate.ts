
import mongoose, { Model, Schema, Types } from "mongoose";

export interface IncidentUpdateLook {
  incidentId: Types.ObjectId;
  message: string;
  status?: "investigating"| "identified"| "monitoring"| "resolved"| null;
  createdAt: Date;
  updatedAt: Date;
}

const IncidentUpdateSchema = new Schema<IncidentUpdateLook>(
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

IncidentUpdateSchema.index({
  incidentId: 1,
  createdAt: 1,
});

const IncidentUpdate: Model<IncidentUpdateLook> =
  mongoose.models.IncidentUpdate ||
  mongoose.model<IncidentUpdateLook>(
    "IncidentUpdate",
    IncidentUpdateSchema
  );

export default IncidentUpdate;
