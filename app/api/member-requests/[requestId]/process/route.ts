import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/db/mongodb"
import MemberRequest from "@/lib/models/MemberRequest"
import Organization from "@/lib/models/Organization"
import User from "@/lib/models/User"
import { authenticateUser, unauthorizedResponse, forbiddenResponse } from "@/lib/middleware/auth"

export async function POST(request: NextRequest, { params }: { params: Promise<{ requestId: string }> }) {
  try {
    // Authenticate user
    const auth = await authenticateUser(request)

    if (!auth.isAuthenticated || !auth.user) {
      return unauthorizedResponse(auth.error || "Unauthorized")
    }

    // Only Admin can approve/reject requests
    if (auth.user.role !== "Admin") {
      return forbiddenResponse("Only admins can process member requests")
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

    const { requestId } = await params
    const body = await request.json()
    const { action } = body // "approve" or "reject"

    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid action. Must be 'approve' or 'reject'",
        },
        { status: 400 },
      )
    }

    // Find the member request
    const memberRequest = await MemberRequest.findById(requestId)

    if (!memberRequest) {
      return NextResponse.json(
        {
          success: false,
          error: "Member request not found",
        },
        { status: 404 },
      )
    }

    // Check if request is already processed
    if (memberRequest.status !== "pending") {
      return NextResponse.json(
        {
          success: false,
          error: `Request has already been ${memberRequest.status}`,
        },
        { status: 400 },
      )
    }

    // Verify admin belongs to the same organization
    if (memberRequest.organizationId.toString() !== userOrgId.toString()) {
      return forbiddenResponse("You can only process requests for your organization")
    }

    if (action === "approve") {
      // Approve the request
      memberRequest.status = "approved"
      memberRequest.processedAt = new Date()
      memberRequest.processedBy = auth.user.userId as any
      await memberRequest.save()

      // Add user to organization members with "active" status
      const organization = await Organization.findById(memberRequest.organizationId)
      if (organization) {
        organization.members.push({
          userId: memberRequest.userId,
          role: "Member",
          status: "active",
          joinedAt: new Date(),
        })
        await organization.save()
      }

      // Update user's organizations array and set as current organization
      const user = await User.findById(memberRequest.userId)
      if (user) {
        // Initialize organizations array if it doesn't exist (for users created before migration)
        if (!user.organizations) {
          user.organizations = []
        }

        // Add to organizations array if not already present
        const existingOrgIndex = user.organizations.findIndex(
          (org: any) => org.organizationId.toString() === memberRequest.organizationId.toString(),
        )

        if (existingOrgIndex === -1) {
          user.organizations.push({
            organizationId: memberRequest.organizationId,
            role: "Member",
            joinedAt: new Date(),
          })
        }

        // Set as current organization
        user.currentOrganizationId = memberRequest.organizationId
        user.organizationId = memberRequest.organizationId // Keep for backward compatibility
        user.role = "Member"
        await user.save()
      }

      return NextResponse.json(
        {
          success: true,
          message: "Member request approved successfully",
          request: {
            id: memberRequest._id,
            status: memberRequest.status,
          },
        },
        { status: 200 },
      )
    } else {
      // Reject the request
      memberRequest.status = "rejected"
      memberRequest.processedAt = new Date()
      memberRequest.processedBy = auth.user.userId as any
      await memberRequest.save()

      return NextResponse.json(
        {
          success: true,
          message: "Member request rejected successfully",
          request: {
            id: memberRequest._id,
            status: memberRequest.status,
          },
        },
        { status: 200 },
      )
    }
  } catch (error: any) {
    console.error("Process member request error:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}
