import mongoose, { Document, Schema, Model } from "mongoose"

export interface ITeam extends Document {
    _id: mongoose.Types.ObjectId
    name: string
    leader: mongoose.Types.ObjectId // Reference to User
    members: mongoose.Types.ObjectId[] // Array of References to User
    description?: string
    createdAt: Date
    updatedAt: Date
}

const TeamSchema = new Schema<ITeam>(
    {
        name: {
            type: String,
            required: [true, "Team name is required"],
            unique: true,
            trim: true,
            maxlength: [100, "Team name cannot exceed 100 characters"],
        },
        leader: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: false, // Optional initially
        },
        members: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        description: {
            type: String,
            maxlength: [500, "Description cannot exceed 500 characters"],
        },
    },
    {
        timestamps: true,
    },
)

if (mongoose.models.Team) {
    delete mongoose.models.Team
}

const Team: Model<ITeam> = mongoose.model<ITeam>("Team", TeamSchema)

export default Team
