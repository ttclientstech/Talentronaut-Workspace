import { NextRequest, NextResponse } from "next/server"
import { authenticateUser } from "@/lib/middleware/auth"
import Project from "@/lib/models/Project"
import User from "@/lib/models/User"
import Task from "@/lib/models/Task"
import connectDB from "@/lib/db/mongodb"

// POST /api/projects/[id]/members - Add member to project
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()

    // Authenticate user
    const auth = await authenticateUser(request)
    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { id: projectId } = await params
    const { memberId } = await request.json()

    if (!memberId) {
      return NextResponse.json({ success: false, error: "Member ID is required" }, { status: 400 })
    }

    // Find the project
    const project = await Project.findById(projectId)
    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 })
    }

    // Check permissions
    const isProjectLead = project.leadId?.toString() === auth.user.userId
    const isAdmin = auth.user.role === "Admin"

    if (!isProjectLead && !isAdmin) {
      return NextResponse.json(
        { success: false, error: "Only project leads or admins can manage team members" },
        { status: 403 },
      )
    }

    // Check if member exists
    const member = await User.findById(memberId).select("name email role skills")
    if (!member) {
      return NextResponse.json({ success: false, error: "Member not found" }, { status: 404 })
    }

    // Check if member is already in the project
    if (project.memberIds.some((id: any) => id.toString() === memberId)) {
      return NextResponse.json({ success: false, error: "Member is already in the project" }, { status: 400 })
    }

    // Add member to project
    project.memberIds.push(memberId)
    await project.save()

    return NextResponse.json(
      {
        success: true,
        message: `${member.name} has been added to the project`,
        member: {
          id: member._id.toString(),
          name: member.name,
          email: member.email,
          role: member.role,
          skills: member.skills || [],
        },
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error("Error adding member to project:", error)
    return NextResponse.json({ success: false, error: "Failed to add member to project" }, { status: 500 })
  }
}

// DELETE /api/projects/[id]/members - Remove member from project
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()

    // Authenticate user
    const auth = await authenticateUser(request)
    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { id: projectId } = await params
    const { searchParams } = new URL(request.url)
    const memberId = searchParams.get("memberId")

    if (!memberId) {
      return NextResponse.json({ success: false, error: "Member ID is required" }, { status: 400 })
    }

    // Find the project
    const project = await Project.findById(projectId)
    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 })
    }

    // Check permissions
    const isProjectLead = project.leadId?.toString() === auth.user.userId
    const isAdmin = auth.user.role === "Admin"

    if (!isProjectLead && !isAdmin) {
      return NextResponse.json(
        { success: false, error: "Only project leads or admins can manage team members" },
        { status: 403 },
      )
    }

    // Check if member is in the project
    if (!project.memberIds.some((id: any) => id.toString() === memberId)) {
      return NextResponse.json({ success: false, error: "Member is not in the project" }, { status: 400 })
    }

    // Don't allow removing the project lead
    if (project.leadId?.toString() === memberId) {
      return NextResponse.json({ success: false, error: "Cannot remove the project lead" }, { status: 400 })
    }

    // Check if member has any tasks assigned in this project
    const tasksCount = await Task.countDocuments({ projectId: projectId, assignedToId: memberId })
    if (tasksCount > 0) {
      return NextResponse.json({
        success: false,
        error: `Cannot remove member. They have ${tasksCount} task(s) assigned in this project. Please reassign their tasks first.`,
        tasksCount: tasksCount,
      }, { status: 400 })
    }

    // Get member name for response
    const member = await User.findById(memberId)

    // Remove member from project
    project.memberIds = project.memberIds.filter((id: any) => id.toString() !== memberId)
    await project.save()

    return NextResponse.json(
      {
        success: true,
        message: `${member?.name || "Member"} has been removed from the project`,
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error("Error removing member from project:", error)
    return NextResponse.json({ success: false, error: "Failed to remove member from project" }, { status: 500 })
  }
}
