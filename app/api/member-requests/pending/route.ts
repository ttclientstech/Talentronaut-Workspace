import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/db/mongodb"
import MemberRequest from "@/lib/models/MemberRequest"
import User from "@/lib/models/User"
import { authenticateUser, unauthorizedResponse, forbiddenResponse } from "@/lib/middleware/auth"

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const auth = await authenticateUser(request)

    if (!auth.isAuthenticated || !auth.user) {
      return unauthorizedResponse(auth.error || "Unauthorized")
    }

    // Only Admin and Lead can view pending requests
    if (auth.user.role !== "Admin" && auth.user.role !== "Lead") {
      return forbiddenResponse("Only admins and leads can view pending requests")
    }

    await connectDB()

    // Get current user's organization from database (not JWT)
    // Use currentOrganizationId (new field) or fallback to organizationId (deprecated)
    const currentUser = await User.findById(auth.user.userId).select("currentOrganizationId organizationId")
    const userOrgId = currentUser?.currentOrganizationId || currentUser?.organizationId

    if (!currentUser || !userOrgId) {
      return NextResponse.json(
        {
          success: false,
          error: "User is not part of any organization",
        },
        { status: 400 },
      )
    }

    // Get pending requests for the organization
    const pendingRequests = await MemberRequest.find({
      organizationId: userOrgId,
      status: "pending",
    })
      .populate("userId", "name email profilePicture")
      .sort({ requestedAt: -1 })

    const formattedRequests = pendingRequests.map((req) => {
      const user = req.userId as any
      return {
        id: req._id,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          profilePicture: user.profilePicture,
        },
        status: req.status,
        requestedAt: req.requestedAt,
      }
    })

    return NextResponse.json(
      {
        success: true,
        requests: formattedRequests,
        count: formattedRequests.length,
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error("Get pending requests error:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}
