import mongoose, { Document, Schema, Model } from "mongoose"
import bcrypt from "bcryptjs"

interface WorkingHours {
  start: string
  end: string
  enabled: boolean
}

interface TimeBlock {
  id: string
  title: string
  day: string
  startTime: string
  endTime: string
  type: "working" | "blocked"
}

interface Schedule {
  workingHours: {
    monday: WorkingHours
    tuesday: WorkingHours
    wednesday: WorkingHours
    thursday: WorkingHours
    friday: WorkingHours
    saturday: WorkingHours
    sunday: WorkingHours
  }
  timeBlocks: TimeBlock[]
}

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId
  name: string
  email: string
  password?: string // Made optional
  profilePicture?: string
  role: "Admin" | "Lead" | "Member"
  skills?: string[]
  schedule?: Schedule
  accessCode: string // Made required
  phoneNumber?: string
  domain?: string
  joinDate?: Date
  createdAt: Date
  updatedAt: Date
  comparePassword(candidatePassword: string): Promise<boolean>
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: false, // Made optional
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    profilePicture: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: ["Admin", "Lead", "Member"],
      default: "Member",
    },
    // Organizations fields removed for single-company architecture

    skills: {
      type: [String],
      default: [],
    },
    schedule: {
      type: Schema.Types.Mixed,
      default: {
        workingHours: {
          monday: { start: "09:00", end: "17:00", enabled: true },
          tuesday: { start: "09:00", end: "17:00", enabled: true },
          wednesday: { start: "09:00", end: "17:00", enabled: true },
          thursday: { start: "09:00", end: "17:00", enabled: true },
          friday: { start: "09:00", end: "17:00", enabled: true },
          saturday: { start: "09:00", end: "17:00", enabled: false },
          sunday: { start: "09:00", end: "17:00", enabled: false },
        },
        timeBlocks: [],
      },
    },
    accessCode: {
      type: String,
      required: [true, "Access code is required"], // Made required
      unique: true,
    },
    phoneNumber: {
      type: String,
    },
    domain: {
      type: String,
    },
    joinDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
)

// Index for faster queries (email index is already created by unique: true)
// Organization indexes removed

// Method to compare password (only if password exists)
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password)
}

// Hash password before saving
UserSchema.pre("save", async function (next) {
  // Only hash if password exists and is modified
  if (!this.isModified("password") || !this.password) {
    return next()
  }

  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
  next()
})

if (mongoose.models.User) {
  delete mongoose.models.User
}

const User: Model<IUser> = mongoose.model<IUser>("User", UserSchema)

export default User
