import { NextRequest, NextResponse } from "next/server"
import { authenticateUser, forbiddenResponse } from "@/lib/middleware/auth"
import User from "@/lib/models/User"
import Task from "@/lib/models/Task"
import Project from "@/lib/models/Project"
import connectDB from "@/lib/db/mongodb"
import mongoose from "mongoose"

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()

    // Authenticate user
    const auth = await authenticateUser(request)
    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Only Admin can remove members
    if (auth.user.role !== "Admin") {
      return forbiddenResponse("Only admins can remove members")
    }

    const { id: memberId } = await params

    // Prevent removing yourself
    if (memberId === auth.user.userId) {
      return NextResponse.json({ success: false, error: "You cannot remove yourself" }, { status: 400 })
    }

    // Get the member to remove
    const memberToRemove = await User.findById(memberId).select("name email role")
    if (!memberToRemove) {
      return NextResponse.json({ success: false, error: "Member not found" }, { status: 404 })
    }

    // Check if member has any assigned tasks (Global check)
    const assignedTasks = await Task.countDocuments({
      assignedToId: memberId,
    })

    if (assignedTasks > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot remove member. They have ${assignedTasks} assigned task(s). Please reassign their tasks first.`,
          details: {
            assignedTasks,
          },
        },
        { status: 400 },
      )
    }

    // Check if member is leading any projects (Global check)
    const leadingProjects = await Project.countDocuments({
      leadId: memberId,
    })

    if (leadingProjects > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot remove member. They are leading ${leadingProjects} project(s). Please reassign the project lead first.`,
          details: {
            leadingProjects,
          },
        },
        { status: 400 },
      )
    }

    // Check if member is part of any project teams (but not leading)
    // Note: Project members array check
    const projectMemberships = await Project.countDocuments({
      memberIds: memberId,
    })

    // Optionally we could auto-remove them from projects, but for safety we might warn
    // Actually, in the previous logic it warned. Let's keep the warning to be safe.
    if (projectMemberships > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot remove member. They are a team member in ${projectMemberships} project(s). Please remove them from project teams first.`,
          details: {
            projectMemberships,
          },
        },
        { status: 400 },
      )
    }

    // All checks passed, delete the user
    await User.findByIdAndDelete(memberId)

    return NextResponse.json(
      {
        success: true,
        message: `${memberToRemove.name} has been removed from the application`,
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error("Error removing member:", error)
    return NextResponse.json({ success: false, error: "Failed to remove member" }, { status: 500 })
  }
}
