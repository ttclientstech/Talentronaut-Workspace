import { NextRequest, NextResponse } from "next/server"
import { authenticateUser } from "@/lib/middleware/auth"
import Project from "@/lib/models/Project"
import Task from "@/lib/models/Task"
import User from "@/lib/models/User"
import connectDB from "@/lib/db/mongodb"

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    // Authenticate user
    const auth = await authenticateUser(request)
    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Only Admin and Lead can create projects
    const user = await User.findById(auth.user.userId)
    if (!user || (user.role !== "Admin" && user.role !== "Lead")) {
      return NextResponse.json(
        { success: false, error: "Only Admins and Leads can create projects" },
        { status: 403 },
      )
    }

    const body = await request.json()
    const { name, description, leadId, priority, startDate, endDate } = body

    // Validate required fields
    if (!name || !leadId) {
      return NextResponse.json(
        { success: false, error: "Project name and lead are required" },
        { status: 400 },
      )
    }

    // Verify lead exists
    const lead = await User.findById(leadId)
    if (!lead) {
      return NextResponse.json({ success: false, error: "Invalid project lead" }, { status: 400 })
    }

    // Update global role if necessary
    if (lead.role === "Member") {
      lead.role = "Lead"
      await lead.save()
    }

    // Create new project
    const newProject = new Project({
      name,
      description: description || "",
      // organizationId removed
      leadId,
      memberIds: [leadId], // Lead is automatically added as a member
      status: "Not Started",
      priority: priority || "Medium",
      progress: 0,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    })

    await newProject.save()

    // Populate lead information for response
    await newProject.populate("leadId", "name email")

    return NextResponse.json(
      {
        success: true,
        project: {
          id: newProject._id.toString(),
          name: newProject.name,
          description: newProject.description,
          lead: (newProject.leadId as any)?.name || "Unknown",
          leadEmail: (newProject.leadId as any)?.email || "",
          members: newProject.memberIds.length,
          status: newProject.status,
          priority: newProject.priority,
          progress: newProject.progress,
          tasks: 0,
          dueDate: newProject.endDate ? new Date(newProject.endDate).toISOString().split("T")[0] : "",
          startDate: newProject.startDate ? new Date(newProject.startDate).toISOString().split("T")[0] : "",
        },
      },
      { status: 201 },
    )
  } catch (error: any) {
    console.error("Error creating project:", error)
    return NextResponse.json({ success: false, error: "Failed to create project" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    // Authenticate user
    const auth = await authenticateUser(request)
    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Fetch projects (global scope for single company)
    const projects = await Project.find({})
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
          memberIds: project.memberIds?.map((m: any) => m._id?.toString() || m.toString()) || [],
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
    console.error("Error fetching projects:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch projects" }, { status: 500 })
  }
}
