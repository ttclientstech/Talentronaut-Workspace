import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/db/mongodb"
import Organization from "@/lib/models/Organization"
import User from "@/lib/models/User"
import Project from "@/lib/models/Project"
import Task from "@/lib/models/Task"
import { authenticateUser, unauthorizedResponse } from "@/lib/middleware/auth"

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const auth = await authenticateUser(request)

    if (!auth.isAuthenticated || !auth.user) {
      return unauthorizedResponse(auth.error || "Unauthorized")
    }

    await connectDB()

    // Get the user's current organization from the database (not from JWT)
    // This ensures we always have the latest organization after switching
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

    // Get organization with member count
    const organization = await Organization.findById(userOrgId)

    if (!organization) {
      return NextResponse.json(
        {
          success: false,
          error: "Organization not found",
        },
        { status: 404 },
      )
    }

    // Get detailed member information
    // Find users where either organizationId or currentOrganizationId matches
    const members = await User.find({
      $or: [
        { organizationId: organization._id },
        { currentOrganizationId: organization._id }
      ]
    }).select("name email role skills profilePicture")

    // Get project statistics
    const projects = await Project.find({
      organizationId: organization._id,
    }).populate("leadId", "name")

    const projectCount = projects.length
    const activeProjects = projects.filter(p => p.status === "In Progress").length

    // Get task statistics
    const tasks = await Task.find({
      organizationId: organization._id,
    })

    const taskCount = tasks.length
    const pendingTasks = tasks.filter(t => t.status === "Todo").length
    const completedTasks = tasks.filter(t => t.status === "Done").length
    const aiAssignments = tasks.filter(t => t.isAIAssigned).length

    // Get recent projects (last 3)
    const recentProjects = await Project.find({
      organizationId: organization._id,
    })
      .populate("leadId", "name")
      .sort({ createdAt: -1 })
      .limit(3)

    const stats = {
      organization: {
        id: organization._id,
        name: organization.name,
        handle: organization.handle,
        inviteCode: organization.inviteCode,
        adminId: organization.adminId,
      },
      statistics: {
        memberCount: members.length,
        projectCount,
        activeProjects,
        taskCount,
        pendingTasks,
        completedTasks,
        aiAssignments,
      },
      members: members.map(member => ({
        id: member._id,
        name: member.name,
        email: member.email,
        role: member.role,
        skills: member.skills || [],
        profilePicture: member.profilePicture,
      })),
      recentProjects: recentProjects.map(project => ({
        id: project._id,
        name: project.name,
        lead: (project.leadId as any)?.name || "Unknown",
        status: project.status,
        progress: project.progress,
      })),
    }

    return NextResponse.json(
      {
        success: true,
        ...stats,
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error("Get organization stats error:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}