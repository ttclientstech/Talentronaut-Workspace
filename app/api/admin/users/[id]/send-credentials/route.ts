import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/db/mongodb"
import User from "@/lib/models/User"
import { verifyToken } from "@/lib/utils/jwt"
import { sendEmail, sendSMS } from "@/lib/notification"

// Helper to check admin auth
async function checkAdmin(request: NextRequest) {
    const token = request.cookies.get("token")?.value
    if (!token) return null

    const decoded = verifyToken(token)
    if (!decoded) return null

    if (decoded.role !== "Admin") return null

    return decoded
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectDB()
        const admin = await checkAdmin(request)

        if (!admin) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
        }

        const { id: userId } = await params
        const body = await request.json()

        const { method } = body // 'email' or 'phone'

        const user = await User.findById(userId)
        if (!user) {
            return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
        }

        if (!user.accessCode) {
            return NextResponse.json({ success: false, error: "User has no access code" }, { status: 400 })
        }

        if (method === "email") {
            if (!user.email) {
                return NextResponse.json({ success: false, error: "User has no email" }, { status: 400 })
            }
            await sendEmail(user.email, "Your Access Code", `Welcome! Your access code to login is: ${user.accessCode}`)
        } else if (method === "phone") {
            if (!user.phoneNumber) {
                return NextResponse.json({ success: false, error: "User has no phone number" }, { status: 400 })
            }
            await sendSMS(user.phoneNumber, `Welcome! Your access code is: ${user.accessCode}`)
        } else {
            return NextResponse.json({ success: false, error: "Invalid method" }, { status: 400 })
        }

        return NextResponse.json({ success: true, message: `Credentials sent via ${method}` })

    } catch (error: any) {
        console.error("Send credentials error:", error)
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
    }
}
