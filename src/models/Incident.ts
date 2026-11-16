import mongoose, { Schema, Model, Types } from "mongoose";
export type IncidentStatus ="investigating"|"identified"|"monitoring"| "resolved";
export type IncidentSeverity = "minor" | "major" | "critical";
export interface IncidentLook {
  monitorId: Types.ObjectId;
  title: string;
  description: string;
  status: IncidentStatus;
  severity: IncidentSeverity;
  startedAt: Date;
  resolvedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const IncidentSchema = new Schema<IncidentLook>(
  {
    monitorId: {
      type: Schema.Types.ObjectId,
      ref: "Monitor",
      required: [true, "Monitor ID is required"],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Incident title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [150, "Title cannot exceed 150 characters"],
    },

    description: {
      type: String,
      required: [true, "Incident description is required"],
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },

    severity: {
      type: String,
      enum: ["minor", "major", "critical"],
      default: "minor",
      required: true,
    },

    status: {
      type: String,
      enum: ["investigating", "identified", "monitoring", "resolved"],
      default: "investigating",
      required: true,
    },

    startedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },

    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

IncidentSchema.index({
  monitorId: 1,
  startedAt: -1,
});

IncidentSchema.index({
  status: 1,
  startedAt: -1,
});

const Incident: Model<IncidentLook> =
  mongoose.models.Incident ||
  mongoose.model<IncidentLook>("Incident", IncidentSchema);

export default Incident;
