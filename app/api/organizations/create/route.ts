import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/db/mongodb"
import Organization from "@/lib/models/Organization"
import User from "@/lib/models/User"
import { authenticateUser, unauthorizedResponse } from "@/lib/middleware/auth"
import { generateToken } from "@/lib/utils/jwt"

/**
 * Generate a unique invite code
 */
function generateInviteCode(): string {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let code = ""
  for (let i = 0; i < 8; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return code
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const auth = await authenticateUser(request)

    if (!auth.isAuthenticated || !auth.user) {
      return unauthorizedResponse(auth.error || "Unauthorized")
    }

    await connectDB()

    const body = await request.json()
    const { name, handle } = body

    // Validation
    if (!name || !handle) {
      return NextResponse.json(
        {
          success: false,
          error: "Organization name and handle are required",
        },
        { status: 400 },
      )
    }

    // Check if handle already exists
    const existingOrg = await Organization.findOne({ handle: handle.toLowerCase() })

    if (existingOrg) {
      return NextResponse.json(
        {
          success: false,
          error: "Organization handle already taken",
        },
        { status: 400 },
      )
    }

    // Generate unique invite code
    let inviteCode = generateInviteCode()
    let codeExists = await Organization.findOne({ inviteCode })

    while (codeExists) {
      inviteCode = generateInviteCode()
      codeExists = await Organization.findOne({ inviteCode })
    }

    // Create organization
    const organization = await Organization.create({
      name,
      handle: handle.toLowerCase(),
      adminId: auth.user.userId,
      inviteCode,
      members: [
        {
          userId: auth.user.userId,
          role: "Admin",
          status: "active",
          joinedAt: new Date(),
        },
      ],
    })

    // Update user - add to organizations array and set as current organization
    const user = await User.findById(auth.user.userId)
    if (user) {
      // Initialize organizations array if it doesn't exist (for users created before migration)
      if (!user.organizations) {
        user.organizations = []
      }

      // Add to organizations array
      user.organizations.push({
        organizationId: organization._id,
        role: "Admin",
        joinedAt: new Date(),
      })
      user.currentOrganizationId = organization._id
      user.organizationId = organization._id // Keep for backward compatibility
      user.role = "Admin"

      await user.save()

    
    }

    // Generate new token with updated role
    const newToken = generateToken({
      userId: auth.user.userId,
      email: auth.user.email,
      role: "Admin",
      organizationId: organization._id.toString(),
    })

    // Create response
    const response = NextResponse.json(
      {
        success: true,
        message: "Organization created successfully",
        organization: {
          id: organization._id,
          name: organization.name,
          handle: organization.handle,
          inviteCode: organization.inviteCode,
          adminId: organization.adminId,
        },
        token: newToken,
      },
      { status: 201 },
    )

    // Update token cookie
    // Note: secure flag is disabled to work with HTTP (enable after setting up HTTPS)
    response.cookies.set("token", newToken, {
      httpOnly: true,
      secure: false, // Set to true after configuring HTTPS/SSL
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    })

    return response
  } catch (error: any) {
    console.error("Create organization error:", error)

    // Handle mongoose validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err: any) => err.message)
      return NextResponse.json(
        {
          success: false,
          error: messages.join(", "),
        },
        { status: 400 },
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}
