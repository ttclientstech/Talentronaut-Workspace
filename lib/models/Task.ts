import mongoose, { Document, Schema, Model } from "mongoose"

export interface ISubtask {
  id: string
  title: string
  completed: boolean
}

export interface ITask extends Document {
  _id: mongoose.Types.ObjectId
  title: string
  description?: string
  projectId?: mongoose.Types.ObjectId // Optional for personal tasks
  // organizationId removed
  assignedToId: mongoose.Types.ObjectId
  assignedById: mongoose.Types.ObjectId
  status: "Todo" | "Planning" | "In Progress" | "Done" | "Blocked"
  priority: "Low" | "Medium" | "High" | "Critical"
  dueDate?: Date
  completedAt?: Date
  isAIAssigned: boolean
  skills: string[]
  subtasks: ISubtask[]
  createdAt: Date
  updatedAt: Date
}

const TaskSchema = new Schema<ITask>(
  {
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
      minlength: [2, "Task title must be at least 2 characters"],
      maxlength: [200, "Task title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: false, // Optional for personal tasks
      default: null,
      validate: {
        validator: function (v: any) {
          // Allow null or undefined for personal tasks
          return v === null || v === undefined || mongoose.Types.ObjectId.isValid(v)
        },
        message: "Invalid project ID",
      },
    },
    // organizationId removed
    assignedToId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Task must be assigned to someone"],
    },
    assignedById: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Assigner is required"],
    },
    status: {
      type: String,
      enum: ["Todo", "Planning", "In Progress", "Done", "Blocked"],
      default: "Todo",
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium",
    },
    skills: {
      type: [String],
      default: [],
    },
    subtasks: {
      type: [
        {
          id: { type: String, required: true },
          title: { type: String, required: true },
          completed: { type: Boolean, default: false },
        },
      ],
      default: [],
    },
    dueDate: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    isAIAssigned: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
)

// Indexes for faster queries
// TaskSchema.index({ organizationId: 1 })
TaskSchema.index({ projectId: 1 })
TaskSchema.index({ assignedToId: 1 })
TaskSchema.index({ status: 1 })
TaskSchema.index({ priority: 1 })
TaskSchema.index({ createdAt: -1 })

// Update completedAt when status changes to Done
TaskSchema.pre("save", function (next) {
  if (this.isModified("status")) {
    if (this.status === "Done" && !this.completedAt) {
      this.completedAt = new Date()
    } else if (this.status !== "Done") {
      this.completedAt = undefined
    }
  }
  next()
})

// Delete existing model to ensure schema updates are applied
if (mongoose.models.Task) {
  delete mongoose.models.Task
}

// Create or recreate the model with updated schema
const Task: Model<ITask> = mongoose.model<ITask>("Task", TaskSchema)

export default Task