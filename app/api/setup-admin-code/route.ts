import { NextResponse } from "next/server"
import connectDB from "@/lib/db/mongodb"
import User from "@/lib/models/User"

export async function GET() {
    try {
        await connectDB()

        // Find an admin user
        const admin = await User.findOne({ role: "Admin" })

        if (!admin) {
            return NextResponse.json({ success: false, message: "No admin user found" })
        }

        // Set code
        admin.accessCode = "ADMIN123"
        await admin.save()

        return NextResponse.json({
            success: true,
            message: "Admin code set",
            email: admin.email,
            accessCode: admin.accessCode
        })
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message })
    }
}
