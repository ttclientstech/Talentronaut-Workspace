import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/db/mongodb"
import User from "@/lib/models/User"
import { verifyToken } from "@/lib/utils/jwt"

// Helper to check admin auth
async function checkAdmin(request: NextRequest) {
    const token = request.cookies.get("token")?.value
    if (!token) return null

    const decoded = verifyToken(token)
    if (!decoded) return null

    // For now, check role in token. Ideally verify against DB for critical actions.
    if (decoded.role !== "Admin") return null

    return decoded
}

// GET: List all users (Admin only)
export async function GET(request: NextRequest) {
    try {
        await connectDB()
        const admin = await checkAdmin(request)

        if (!admin) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
        }

        // Fetch all users globally
        const users = await User.find({}).sort({ createdAt: -1 })

        return NextResponse.json({ success: true, users })
    } catch (error: any) {
        console.error("Get users error:", error)
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
    }
}

// POST: Create a new user (Admin only)
export async function POST(request: NextRequest) {
    try {
        await connectDB()
        const admin = await checkAdmin(request)

        if (!admin) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { name, email, phoneNumber, domain, joinDate, autoGenerateCode } = body

        if (!name || !email) {
            return NextResponse.json({ success: false, error: "Name and email are required" }, { status: 400 })
        }

        // Check if user exists
        const existingUser = await User.findOne({ email })
        if (existingUser) {
            return NextResponse.json({ success: false, error: "User already exists with this email" }, { status: 400 })
        }

        // Generate access code
        let accessCode = body.accessCode
        if (autoGenerateCode || !accessCode) {
            // Simple 8-char alphanumeric code
            const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
            accessCode = ""
            for (let i = 0; i < 8; i++) {
                accessCode += chars.charAt(Math.floor(Math.random() * chars.length))
            }

            // Ensure uniqueness (simple retry logic)
            let isUnique = false
            let attempts = 0
            while (!isUnique && attempts < 5) {
                const check = await User.findOne({ accessCode })
                if (!check) {
                    isUnique = true
                } else {
                    accessCode = ""
                    for (let i = 0; i < 8; i++) {
                        accessCode += chars.charAt(Math.floor(Math.random() * chars.length))
                    }
                    attempts++
                }
            }
        }

        // Create user
        // Note: We need a dummy password as it might be required by schema (if strict).
        const tempPassword = Math.random().toString(36).slice(-8)

        const newUser = new User({
            name,
            email,
            password: tempPassword, // Will be hashed by pre-save hook
            role: "Member", // Default role
            accessCode,
            phoneNumber,
            domain,
            joinDate: joinDate || new Date(),
        })

        await newUser.save()

        return NextResponse.json({
            success: true,
            user: newUser,
            message: "User created successfully"
        })

    } catch (error: any) {
        console.error("Create user error:", error)
        return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 })
    }
}
