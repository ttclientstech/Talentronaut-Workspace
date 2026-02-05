import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/db/mongodb"
import ProjectAccessToken from "@/lib/models/ProjectAccessToken"
import Project from "@/lib/models/Project"
import { generateToken } from "@/lib/utils/jwt"

export async function POST(request: NextRequest) {
    try {
        await connectDB()

        const body = await request.json()
        const { accessCode } = body

        if (!accessCode) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Access code is required",
                },
                { status: 400 },
            )
        }

        // Find the access token (case-insensitive, remove spaces)
        const cleanCode = accessCode.toUpperCase().replace(/\s/g, '')
        const accessToken = await ProjectAccessToken.findOne({
            token: cleanCode,
            isActive: true
        })

        if (!accessToken) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Invalid access code",
                },
                { status: 401 },
            )
        }

        // Get the project details
        const project = await Project.findById(accessToken.projectId)

        if (!project) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Project not found",
                },
                { status: 404 },
            )
        }

        // Mark token as used if first time
        if (!accessToken.usedAt) {
            accessToken.usedAt = new Date()
            await accessToken.save()
        }

        // Generate a guest JWT token for this email + project
        const token = generateToken({
            userId: "guest_" + accessToken._id.toString(),
            email: accessToken.email,
            role: "Member", // Guest users are members by default
            projectId: project._id.toString(),
        })

        // Create response
        const response = NextResponse.json(
            {
                success: true,
                message: "Login successful",
                user: {
                    id: "guest_" + accessToken._id.toString(),
                    name: accessToken.email.split('@')[0], // Use email prefix as name
                    email: accessToken.email,
                    role: "Member",
                    isGuest: true,
                    projectId: project._id.toString(),
                    projectName: project.name,
                },
                token,
                redirectTo: `/guest`, // Redirect to dedicated guest page
            },
            { status: 200 },
        )

        // Set token as HTTP-only cookie
        response.cookies.set("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 30, // 30 days
            path: "/",
        })

        return response
    } catch (error: any) {
        console.error("Project access code login error:", error)

        return NextResponse.json(
            {
                success: false,
                error: "Internal server error",
            },
            { status: 500 },
        )
    }
}
