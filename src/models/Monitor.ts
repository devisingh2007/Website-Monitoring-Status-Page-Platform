import mongoose, { Schema, Model, Types } from "mongoose";

export type MonitorType = "website" | "api";
export type MonitorStatus = "operational" | "down" | "paused";

export interface MonitorLook {
  projectId: Types.ObjectId;
  name: string;
  url: string;
  type: MonitorType;
  interval: number;
  timeout: number;
  expectedStatusCodes: number[];
  status: MonitorStatus;
  enabled: boolean;
  failureCount: number;
  nextCheckAt: Date;
  lastCheckedAt?: Date;
  lastResponseTime?: number;
  createdAt: Date;
  updatedAt: Date;
}

const MonitorSchema = new Schema<MonitorLook>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Project ID is required"],
      index: true,
    },
    name: {
      type: String,
      required: [true, "monitor name is required"],
      trim: true,
      minlength: [2, "monitor name must be at least 2 charecteor"],
      maxlength: [100, "monitor name maximum contain only 100 charecteor"],
    },
    url: {
      type: String,
      required: [true, "Monitor URL is required"],
      trim: true,
      maxlength: [2048, "URL is too long"],
    },
    type: {
      type: String,
      enum: {
        values: ["website", "api"],
        message: "Monitor type must be website or api",
      },
      required: true,
    },
    interval: {
      type: Number,
      enum: {
        values: [5, 10, 15, 30],
        message: "Interval must be 5,10,15 or 30 minutes",
      },
      default: 5,
    },
    timeout: {
      type: Number,
      min: [1000, "Timeout must be at least 1000 ms"],
      max: [30000, "timeout cannot exceed 30000 ms"],
      default: 10000,
    },
    expectedStatusCodes: {
      type: [Number],
      default: [200],
      validate: {
        validator: (codes: number[]) =>
          codes.length > 0 &&
          codes.every(
            (code) => Number.isInteger(code) && code >= 200 && code <= 599,
          ),
        message: "Provide valid expected HTTP status codes",
      },
    },
    status: {
      type: String,
      enum: ["operational", "down", "paused"],
      default: "operational",
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    failureCount: {
      type: Number,
      min: 0,
      default: 0,
    },
    nextCheckAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    lastCheckedAt: {
      type: Date,
      default: null,
    },
    lastResponseTime: {
      type: Number,
      min: 0,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

MonitorSchema.index({
  enabled: 1,
  nextCheckAt: 1,
});

const Monitor: Model<MonitorLook> =
  mongoose.models.Monitor ||
  mongoose.model<MonitorLook>("Monitor", MonitorSchema);
export default Monitor;
