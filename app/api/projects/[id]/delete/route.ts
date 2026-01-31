import { NextRequest, NextResponse } from "next/server"
import { authenticateUser } from "@/lib/middleware/auth"
import Project from "@/lib/models/Project"
import Task from "@/lib/models/Task"
import connectDB from "@/lib/db/mongodb"

// DELETE /api/projects/[id]/delete - Admin can delete project if all tasks are done and project is closed
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()

    // Authenticate user
    const auth = await authenticateUser(request)
    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is Admin
    if (auth.user.role !== "Admin") {
      return NextResponse.json(
        { success: false, error: "Only Admins can delete projects" },
        { status: 403 },
      )
    }

    const { id: projectId } = await params

    // Fetch project
    const project = await Project.findById(projectId)
    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 })
    }

    // Check if project is closed
    if (project.status !== "Closed") {
      return NextResponse.json(
        {
          success: false,
          error: "Project must be closed by the lead before it can be deleted. Current status: " + project.status,
        },
        { status: 400 },
      )
    }

    // Verify all tasks are done (safety check)
    const totalTasks = await Task.countDocuments({ projectId: projectId })
    const completedTasks = await Task.countDocuments({ projectId: projectId, status: "Done" })

    if (totalTasks > 0 && completedTasks < totalTasks) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete project. ${totalTasks - completedTasks} task(s) are still incomplete.`,
          totalTasks: totalTasks,
          completedTasks: completedTasks,
          pendingTasks: totalTasks - completedTasks,
        },
        { status: 400 },
      )
    }

    // Store project name for response
    const projectName = project.name

    // Delete all tasks associated with the project
    const taskDeleteResult = await Task.deleteMany({ projectId: projectId })

    // Delete the project
    await Project.findByIdAndDelete(projectId)

    return NextResponse.json(
      {
        success: true,
        message: `Project "${projectName}" and ${taskDeleteResult.deletedCount} associated task(s) deleted successfully`,
        deletedTasks: taskDeleteResult.deletedCount,
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error("Error deleting project:", error)
    return NextResponse.json({ success: false, error: "Failed to delete project" }, { status: 500 })
  }
}
