import mongoose, { Model, Schema } from "mongoose"

export interface IProjectAccessToken {
    _id: mongoose.Types.ObjectId
    projectId: mongoose.Types.ObjectId
    email: string
    token: string
    createdAt: Date
    expiresAt?: Date
    usedAt?: Date
    isActive: boolean
}

const ProjectAccessTokenSchema = new Schema<IProjectAccessToken>({
    projectId: {
        type: Schema.Types.ObjectId,
        ref: "Project",
        required: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    token: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    expiresAt: {
        type: Date,
        default: null
    },
    usedAt: {
        type: Date,
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    }
})

// Compound index for efficient queries
ProjectAccessTokenSchema.index({ projectId: 1, email: 1 })

// Prevent model recompilation in development
if (mongoose.models.ProjectAccessToken) {
    delete mongoose.models.ProjectAccessToken
}

const ProjectAccessToken: Model<IProjectAccessToken> = mongoose.model<IProjectAccessToken>(
    "ProjectAccessToken",
    ProjectAccessTokenSchema
)

export default ProjectAccessToken
