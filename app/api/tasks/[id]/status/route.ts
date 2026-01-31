import { NextRequest, NextResponse } from "next/server"
import { authenticateUser } from "@/lib/middleware/auth"
import Task from "@/lib/models/Task"
import connectDB from "@/lib/db/mongodb"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()

    // Authenticate user
    const auth = await authenticateUser(request)
    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { status } = body

    // Validate status
    const validStatuses = ["Todo", "Planning", "In Progress", "Done", "Blocked"]
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 })
    }

    // Find the task
    const task = await Task.findById(id)
    if (!task) {
      return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 })
    }

    // Check if user has permission to update this task
    // User can update if they are:
    // 1. The assignee
    // 2. The assigner (assignedById)
    // 3. Admin
    // 4. (Ideally) Project Lead of the project

    // Simplification: Assignee, Assigner, or Admin/Lead
    // We can fetch project lead if needed, but for now allow assignee/assigner
    const isAssignee = task.assignedToId.toString() === auth.user.userId
    const isAssigner = task.assignedById?.toString() === auth.user.userId
    const isAdmin = auth.user.role === "Admin"
    const isLead = auth.user.role === "Lead" // Assuming Leads can update any task (global) or we should check project specific...
    // To match previous logic, let's allow assignee, assigner, or general Lead/Admin access for simplicity in single tenant

    if (!isAssignee && !isAssigner && !isAdmin && !isLead) {
      return NextResponse.json({ success: false, error: "Unauthorized to update this task" }, { status: 403 })
    }

    // Update task status
    task.status = status
    task.completedAt = status === "Done" ? new Date() : undefined
    await task.save()

    return NextResponse.json(
      {
        success: true,
        task: {
          id: task._id.toString(),
          status: task.status,
          completedAt: task.completedAt,
        },
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error("Error updating task status:", error)
    return NextResponse.json({ success: false, error: "Failed to update task status" }, { status: 500 })
  }
}
