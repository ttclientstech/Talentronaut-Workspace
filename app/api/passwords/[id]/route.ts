import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/db/mongodb"
import Password from "@/lib/models/Password"
import { verifyToken } from "@/lib/utils/jwt"

async function checkAdmin(request: NextRequest) {
    const token = request.cookies.get("token")?.value
    if (!token) return null
    const decoded = verifyToken(token)
    if (!decoded || (decoded as any).role !== "Admin") return null
    return decoded
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectDB()
        const admin = await checkAdmin(request)
        if (!admin) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

        const { id } = await params
        const body = await request.json()
        const { name, value, accessList } = body

        const password = await Password.findByIdAndUpdate(
            id,
            { name, value, accessList },
            { new: true, runValidators: true }
        )

        if (!password) {
            return NextResponse.json({ success: false, error: "Password not found" }, { status: 404 })
        }

        return NextResponse.json({ success: true, password, message: "Password updated successfully" })

    } catch (error: any) {
        console.error("Update password error:", error)
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectDB()
        const admin = await checkAdmin(request)
        if (!admin) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

        const { id } = await params
        const deleted = await Password.findByIdAndDelete(id)

        if (!deleted) {
            return NextResponse.json({ success: false, error: "Password not found" }, { status: 404 })
        }

        return NextResponse.json({ success: true, message: "Password deleted successfully" })

    } catch (error: any) {
        console.error("Delete password error:", error)
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
    }
}
