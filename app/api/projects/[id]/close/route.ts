import { NextRequest, NextResponse } from "next/server"
import { authenticateUser } from "@/lib/middleware/auth"
import Project from "@/lib/models/Project"
import Task from "@/lib/models/Task"
import connectDB from "@/lib/db/mongodb"
import mongoose from "mongoose"

// POST /api/projects/[id]/close - Lead can close project if all tasks are done
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()

    // Authenticate user
    const auth = await authenticateUser(request)
    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { id: projectId } = await params

    // Fetch project
    const project = await Project.findById(projectId)
    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 })
    }

    // Check if user is the lead of this project
    // Also allow Admins to close projects if needed, but per requirement "Lead can close"
    // Let's stick to Lead only for closing, or Admin as backup.
    if (project.leadId.toString() !== auth.user.userId && auth.user.role !== "Admin") {
      return NextResponse.json(
        { success: false, error: "Only the project lead can close the project" },
        { status: 403 },
      )
    }

    // Check if project is already closed
    if (project.status === "Closed") {
      return NextResponse.json({ success: false, error: "Project is already closed" }, { status: 400 })
    }

    // Check if all tasks are done
    const totalTasks = await Task.countDocuments({ projectId: projectId })
    const completedTasks = await Task.countDocuments({ projectId: projectId, status: "Done" })

    if (totalTasks === 0) {
      return NextResponse.json(
        { success: false, error: "Cannot close project with no tasks. Add tasks first." },
        { status: 400 },
      )
    }

    if (completedTasks < totalTasks) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot close project. ${totalTasks - completedTasks} task(s) are still incomplete.`,
          totalTasks: totalTasks,
          completedTasks: completedTasks,
          pendingTasks: totalTasks - completedTasks,
        },
        { status: 400 },
      )
    }

    // Close the project
    project.status = "Closed"
    project.closedAt = new Date()
    project.closedById = new mongoose.Types.ObjectId(auth.user.userId)
    project.progress = 100
    await project.save()

    return NextResponse.json(
      {
        success: true,
        message: "Project closed successfully",
        project: {
          id: project._id.toString(),
          name: project.name,
          status: project.status,
          closedAt: project.closedAt,
        },
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error("Error closing project:", error)
    return NextResponse.json({ success: false, error: "Failed to close project" }, { status: 500 })
  }
}
