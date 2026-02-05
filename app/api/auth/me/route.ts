import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/db/mongodb"
import User from "@/lib/models/User"
import { authenticateUser, unauthorizedResponse } from "@/lib/middleware/auth"

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const auth = await authenticateUser(request)

    if (!auth.isAuthenticated || !auth.user) {
      return unauthorizedResponse(auth.error || "Unauthorized")
    }

    await connectDB()

    // Check if user is a guest (logged in with access code)
    const isGuest = auth.user.userId.startsWith('guest_')

    if (isGuest) {
      // Return guest user data without querying database
      return NextResponse.json(
        {
          success: true,
          user: {
            id: auth.user.userId,
            name: auth.user.email.split('@')[0], // Use email prefix as name
            email: auth.user.email,
            profilePicture: null,
            role: auth.user.role,
            skills: [],
            createdAt: new Date().toISOString(),
            isGuest: true,
            projectId: auth.user.projectId,
          },
        },
        { status: 200 },
      )
    }

    // Get user from database (for regular users)
    const user = await User.findById(auth.user.userId)

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        },
        { status: 404 },
      )
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          profilePicture: user.profilePicture,
          role: user.role,
          skills: user.skills,
          createdAt: user.createdAt,
        },
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error("Get user error:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}
