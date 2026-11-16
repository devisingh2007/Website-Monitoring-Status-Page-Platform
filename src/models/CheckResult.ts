import mongoose, { Schema, Model, Types } from "mongoose";

export interface CheckResultLook {
  monitorId: mongoose.Types.ObjectId;
  status: "success" | "failure";
  statusCode?: number | null;
  responseTime?: number | null;

  errorMessage?: string;
  checkedAt: Date;
}

const CheckResultSchema = new Schema<CheckResultLook>(
  {
    monitorId: {
      type: Schema.Types.ObjectId,
      ref: "Monitor",
      required: [true, "Monitor id is required"],
      index: true,
    },
    status: {
      type: String,
      enum: ["Success", "failure"],
      required: [true, "Ceck status is required"],
    },
    statusCode: {
      type: Number,
      min: [100, "Invalid HTTP Status code"],
      max: [599, "Invalid HTTP Status code"],
      default: null,
    },
    responseTime: {
      type: Number,
      min: [0, "Response time can not be negative"],
      default: null,
    },
    errorMessage: {
      type: String,
      trim: true,
      maxlength: [500, "Error Message is too long"],
      default: "",
    },

    checkedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

CheckResultSchema.index({
  monitorId: 1,
  checkedAt: -1,
});

const CheckResult: Model<CheckResultLook> =
  mongoose.models.CheckResult ||
  mongoose.model<CheckResultLook>("CheckResult", CheckResultSchema);

export default CheckResult;
