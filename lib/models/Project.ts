import mongoose, { Document, Schema, Model } from "mongoose"

export interface IProjectPhase {
  _id: mongoose.Types.ObjectId
  phase: string
  date: string
  description: string
  platform: string
  status: string
}

export interface IProject extends Document {
  _id: mongoose.Types.ObjectId
  name: string
  description?: string
  // organizationId removed
  createdById: mongoose.Types.ObjectId
  leadId: mongoose.Types.ObjectId
  memberIds: mongoose.Types.ObjectId[]
  phases: IProjectPhase[]
  status: "Not Started" | "Planning" | "In Progress" | "Completed" | "On Hold" | "Closed"
  priority: "Low" | "Medium" | "High" | "Critical"
  progress: number // 0-100
  startDate?: Date
  endDate?: Date
  closedAt?: Date
  closedById?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const ProjectSchema = new Schema<IProject>(
  {
    name: {
      type: String,
      required: [true, "Project name is required"],
      trim: true,
      minlength: [2, "Project name must be at least 2 characters"],
      maxlength: [100, "Project name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    // organizationId removed
    createdById: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false, // Optional for backward compatibility
    },
    leadId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Project lead is required"],
    },
    memberIds: [{
      type: Schema.Types.ObjectId,
      ref: "User",
    }],
    phases: [{
      phase: { type: String, default: "" },
      date: { type: String, default: "" },
      description: { type: String, default: "" },
      platform: { type: String, default: "Backend" },
      status: { type: String, default: "Pending" }
    }],
    status: {
      type: String,
      enum: ["Not Started", "Planning", "In Progress", "Completed", "On Hold", "Closed"],
      default: "Not Started",
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium",
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
    closedAt: {
      type: Date,
      default: null,
    },
    closedById: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  },
)

// Indexes for faster queries
// ProjectSchema.index({ organizationId: 1 })
ProjectSchema.index({ createdById: 1 })
ProjectSchema.index({ leadId: 1 })
ProjectSchema.index({ status: 1 })
ProjectSchema.index({ createdAt: -1 })

// Delete cached model to ensure schema changes are applied
if (mongoose.models.Project) {
  delete mongoose.models.Project
}

// Create the model with updated schema
const Project: Model<IProject> = mongoose.model<IProject>("Project", ProjectSchema)

export default Project