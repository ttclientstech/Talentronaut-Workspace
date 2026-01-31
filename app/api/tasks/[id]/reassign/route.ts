import { NextRequest, NextResponse } from "next/server"
import { authenticateUser } from "@/lib/middleware/auth"
import Task from "@/lib/models/Task"
import Project from "@/lib/models/Project"
import User from "@/lib/models/User"
import connectDB from "@/lib/db/mongodb"

// PATCH /api/tasks/[id]/reassign - Reassign task to another project member
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()

    // Authenticate user
    const auth = await authenticateUser(request)
    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { id: taskId } = await params
    const { newAssigneeId } = await request.json()

    if (!newAssigneeId) {
      return NextResponse.json({ success: false, error: "New assignee ID is required" }, { status: 400 })
    }

    // Find the task
    const task = await Task.findById(taskId)
    if (!task) {
      return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 })
    }

    // Find the project (if applicable)
    let project = null
    if (task.projectId) {
      project = await Project.findById(task.projectId)
    }

    // Check permissions
    // Allow if:
    // 1. User is Admin
    // 2. User is Project Lead (if project exists)
    // 3. User is Assigner (optional, but good for self-delegation updates)
    const isAdmin = auth.user.role === "Admin"
    const isProjectLead = project && project.leadId?.toString() === auth.user.userId

    // Also allow global Leads to manage tasks if needed, or stick to project lead?
    // Let's stick to Project Lead or Admin for reassigning others' tasks.

    if (!isAdmin && !isProjectLead) {
      return NextResponse.json(
        { success: false, error: "Only project leads or admins can reassign tasks" },
        { status: 403 },
      )
    }

    // Check if new assignee exists
    const newAssignee = await User.findById(newAssigneeId).select("name email role")
    if (!newAssignee) {
      return NextResponse.json({ success: false, error: "New assignee not found" }, { status: 404 })
    }

    // If project exists, check if new assignee is a member of the project or is the lead
    if (project) {
      const isProjectMember =
        project.memberIds.some((id: any) => id.toString() === newAssigneeId) ||
        project.leadId?.toString() === newAssigneeId

      if (!isProjectMember) {
        return NextResponse.json(
          { success: false, error: "New assignee is not a member of this project" },
          { status: 400 },
        )
      }
    }

    // Get old assignee name for response
    const oldAssignee = task.assignedToId ? await User.findById(task.assignedToId) : null

    // Update task assignee (the field is assignedToId)
    task.assignedToId = newAssigneeId
    await task.save()

    return NextResponse.json(
      {
        success: true,
        message: `Task reassigned from ${oldAssignee?.name || "Unassigned"} to ${newAssignee.name}`,
        task: {
          id: task._id.toString(),
          title: task.title,
          assignee: {
            id: newAssignee._id.toString(),
            name: newAssignee.name,
            email: newAssignee.email,
          },
        },
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error("Error reassigning task:", error)
    return NextResponse.json({ success: false, error: "Failed to reassign task" }, { status: 500 })
  }
}
