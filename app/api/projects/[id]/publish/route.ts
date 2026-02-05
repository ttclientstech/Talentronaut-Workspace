import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/db/mongodb"
import Project from "@/lib/models/Project"
import ProjectAccessToken from "@/lib/models/ProjectAccessToken"
import { authenticateUser } from "@/lib/middleware/auth"
import { sendEmail } from "@/lib/notification"
import { generateInvitationEmailHTML, generateInvitationEmailText } from "@/lib/utils/emailTemplates"
import crypto from "crypto"

interface PublishRequest {
    emails: string[]
}

interface PublishResult {
    email: string
    success: boolean
    token?: string
    error?: string
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Unwrap params Promise (Next.js 15 requirement)
        const { id } = await params

        // Verify authentication
        const authResult = await authenticateUser(req)
        if (!authResult.isAuthenticated || !authResult.user) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            )
        }

        await connectDB()

        // Get project and verify access
        const project = await Project.findById(id)
        if (!project) {
            return NextResponse.json(
                { success: false, error: "Project not found" },
                { status: 404 }
            )
        }

        // Verify user has permission (creator, lead, or admin)
        const userId = authResult.user.userId
        const hasPermission =
            project.createdById?.toString() === userId ||
            project.leadId?.toString() === userId ||
            authResult.user.role === "Admin"

        if (!hasPermission) {
            return NextResponse.json(
                { success: false, error: "Insufficient permissions" },
                { status: 403 }
            )
        }

        // Parse request body
        const body: PublishRequest = await req.json()
        const { emails } = body

        if (!emails || !Array.isArray(emails) || emails.length === 0) {
            return NextResponse.json(
                { success: false, error: "No emails provided" },
                { status: 400 }
            )
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        const invalidEmails = emails.filter(email => !emailRegex.test(email.trim()))

        if (invalidEmails.length > 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Invalid email format: ${invalidEmails.join(', ')}`
                },
                { status: 400 }
            )
        }

        // Process each email
        const results: PublishResult[] = []

        for (const email of emails) {
            const cleanEmail = email.trim().toLowerCase()

            if (!cleanEmail) {
                results.push({
                    email,
                    success: false,
                    error: "Empty email address"
                })
                continue
            }

            try {
                // Generate short, readable access code (8 characters, uppercase alphanumeric)
                const generateAccessCode = () => {
                    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Exclude confusing chars: 0, O, 1, I
                    let code = ''
                    for (let i = 0; i < 8; i++) {
                        code += chars.charAt(Math.floor(Math.random() * chars.length))
                    }
                    return code
                }

                let token = generateAccessCode()

                // Ensure uniqueness - regenerate if token already exists
                let existingWithToken = await ProjectAccessToken.findOne({ token })
                while (existingWithToken) {
                    token = generateAccessCode()
                    existingWithToken = await ProjectAccessToken.findOne({ token })
                }

                // Check if token already exists for this email + project
                const existingToken = await ProjectAccessToken.findOne({
                    projectId: project._id,
                    email: cleanEmail,
                    isActive: true
                })

                if (existingToken) {
                    // Deactivate old token and create new one
                    existingToken.isActive = false
                    await existingToken.save()
                }

                // Create new access token
                const accessToken = new ProjectAccessToken({
                    projectId: project._id,
                    email: cleanEmail,
                    token,
                    isActive: true
                })

                await accessToken.save()

                // Generate email content
                const htmlContent = generateInvitationEmailHTML(
                    project.name,
                    token
                )
                const textContent = generateInvitationEmailText(
                    project.name,
                    token
                )

                // Send email
                const emailSent = await sendEmail(
                    cleanEmail,
                    `You've been invited to track ${project.name}`,
                    textContent,
                    htmlContent
                )

                if (emailSent) {
                    results.push({
                        email: cleanEmail,
                        success: true,
                        token // Include for debugging, can remove in production
                    })
                } else {
                    results.push({
                        email: cleanEmail,
                        success: false,
                        error: "Failed to send email"
                    })
                }

            } catch (error) {
                console.error(`Error processing email ${cleanEmail}:`, error)
                results.push({
                    email: cleanEmail,
                    success: false,
                    error: error instanceof Error ? error.message : "Unknown error"
                })
            }
        }

        // Check if all succeeded
        const allSucceeded = results.every(r => r.success)
        const successCount = results.filter(r => r.success).length

        return NextResponse.json({
            success: allSucceeded,
            message: allSucceeded
                ? `Successfully sent ${successCount} invitation(s)`
                : `Sent ${successCount} of ${results.length} invitation(s)`,
            results
        })

    } catch (error) {
        console.error("Error in publish endpoint:", error)
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Internal server error"
            },
            { status: 500 }
        )
    }
}
