import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/db/mongodb"
import Password from "@/lib/models/Password"
import { verifyToken } from "@/lib/utils/jwt"

// Helper to check auth
async function checkAuth(request: NextRequest) {
    const token = request.cookies.get("token")?.value
    if (!token) return null

    const decoded = verifyToken(token)
    if (!decoded) return null

    return decoded
}

export async function GET(request: NextRequest) {
    try {
        await connectDB()
        const user = await checkAuth(request)

        if (!user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
        }

        let query = {}
        // If not admin, only show passwords where user is in accessList
        if ((user as any).role !== "Admin") {
            query = { accessList: (user as any).userId }
        }

        const passwords = await Password.find(query)
            .populate("accessList", "name email") // Populate access list with details for display if needed
            .sort({ createdAt: -1 })

        return NextResponse.json({ success: true, passwords })
    } catch (error: any) {
        console.error("Get passwords error:", error)
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        await connectDB()
        const user = await checkAuth(request)

        if (!user || (user as any).role !== "Admin") {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { name, value, accessList } = body

        if (!name || !value) {
            return NextResponse.json({ success: false, error: "Name and password value are required" }, { status: 400 })
        }

        const newPassword = new Password({
            name,
            value,
            accessList: accessList || [],
        })

        await newPassword.save()

        return NextResponse.json({
            success: true,
            password: newPassword,
            message: "Password created successfully"
        })

    } catch (error: any) {
        console.error("Create password error:", error)
        return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 })
    }
}
