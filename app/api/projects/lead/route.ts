import { NextRequest, NextResponse } from "next/server"
import { authenticateUser } from "@/lib/middleware/auth"
import Project from "@/lib/models/Project"
import Task from "@/lib/models/Task"
import User from "@/lib/models/User"
import connectDB from "@/lib/db/mongodb"

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    // Authenticate user
    const auth = await authenticateUser(request)
    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Fetch projects where the current user is the lead (Global scope)
    const projects = await Project.find({
      leadId: auth.user.userId,
    })
      .populate("leadId", "name email")
      .populate("memberIds", "name")
      .sort({ createdAt: -1 })
      .lean()

    // For each project, get task statistics and calculate progress
    const projectsWithDetails = await Promise.all(
      projects.map(async (project: any) => {
        const totalTasks = await Task.countDocuments({ projectId: project._id })
        const completedTasks = await Task.countDocuments({ projectId: project._id, status: "Done" })

        // Calculate progress based on completed tasks
        const calculatedProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

        // Determine project status based on tasks
        let projectStatus = project.status
        if (totalTasks === 0) {
          projectStatus = "Not Started"
        } else if (completedTasks === totalTasks && totalTasks > 0 && project.status !== "Closed") {
          projectStatus = "Completed"
        } else if (completedTasks > 0 && completedTasks < totalTasks) {
          projectStatus = "In Progress"
        }

        return {
          id: project._id.toString(),
          name: project.name,
          description: project.description || "",
          lead: project.leadId?.name || "Unknown",
          leadEmail: project.leadId?.email || "",
          leadId: project.leadId?._id?.toString() || "",
          members: project.memberIds?.length || 0,
          status: projectStatus,
          priority: project.priority,
          progress: calculatedProgress,
          tasks: totalTasks,
          completedTasks: completedTasks,
          dueDate: project.endDate ? new Date(project.endDate).toISOString().split("T")[0] : "",
          startDate: project.startDate ? new Date(project.startDate).toISOString().split("T")[0] : "",
          closedAt: project.closedAt ? new Date(project.closedAt).toISOString() : null,
        }
      }),
    )

    return NextResponse.json(
      {
        success: true,
        projects: projectsWithDetails,
        count: projectsWithDetails.length,
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error("Error fetching lead projects:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch lead projects" }, { status: 500 })
  }
}
