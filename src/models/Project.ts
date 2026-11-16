import mongoose, { Model, Schema } from "mongoose";

export interface projectlook {
  name: string;
  description: string;
  slug: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
const ProjectSchema = new Schema<projectlook>(
  {
    name: {
      type: String,
      required: [true, "Project name is required"],
      trim: true,
      minlength: [2, "project name must be at least 2 charecteor"],
      maxlength: [100, "project name maximum contain only 100 charecteor"],
    },
    description: {
      type: String,
      trim: true,
      maxLength: [500, "description conatin maximum 500 charector"],
      default: "",
    },
    slug: {
      type: String,
      required: [true, "Project slug required"],
      trim: true,
      lowercase: true,
      unique:true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);
const Project: Model<projectlook> =
  mongoose.models.Project ||
  mongoose.model<projectlook>("Project", ProjectSchema);

export default Project;
