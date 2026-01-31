import mongoose from "mongoose"

const PasswordSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please provide a name for this password entry"],
        maxlength: [60, "Name cannot be more than 60 characters"],
    },
    value: {
        type: String, // Storing as plain text for this specific "password manager" use case where users need to read it.
        required: [true, "Please provide the password value"],
    },
    accessList: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    ],
    createdAt: {
        type: Date,
        default: Date.now,
    },
})

export default mongoose.models.Password || mongoose.model("Password", PasswordSchema)
