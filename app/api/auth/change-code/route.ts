import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/db/mongodb"
import User from "@/lib/models/User"
import { verifyToken } from "@/lib/utils/jwt"

export async function POST(request: NextRequest) {
    try {
        await connectDB()

        const token = request.cookies.get("token")?.value
        if (!token) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
        }

        const decoded = verifyToken(token)
        if (!decoded) {
            return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
        }

        const body = await request.json()
        const { newAccessCode } = body

        if (!newAccessCode || newAccessCode.length < 6) {
            return NextResponse.json({ success: false, error: "Access code must be at least 6 characters" }, { status: 400 })
        }

        // Check if code is taken by another user
        const existing = await User.findOne({ accessCode: newAccessCode })
        if (existing && existing._id.toString() !== decoded.userId) {
            return NextResponse.json({ success: false, error: "This access code is already in use" }, { status: 400 })
        }

        const user = await User.findByIdAndUpdate(
            decoded.userId,
            { accessCode: newAccessCode },
            { new: true }
        )

        return NextResponse.json({
            success: true,
            message: "Access code updated successfully"
        })

    } catch (error: any) {
        console.error("Change code error:", error)
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
    }
}
