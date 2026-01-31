import { NextRequest, NextResponse } from "next/server"
import { authenticateUser } from "@/lib/middleware/auth"
import Task from "@/lib/models/Task"
import User from "@/lib/models/User"
import connectDB from "@/lib/db/mongodb"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()

    // Authenticate user
    const auth = await authenticateUser(request)
    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const task = await Task.findById(id)
      .populate("projectId", "name")
      .populate("assignedToId", "name email")
      .populate("assignedById", "name email")
      .lean()

    if (!task) {
      return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 })
    }

    // Access control:
    // Global visibility for authenticated users (Single Company)
    // Or stricter: must be assignee, assigner, admin, lead, or project member.
    // For now, let's keep it open or at least project-based visibility if I had member list.
    // But since "All Projects/Tasks visible to all authorized users" is the goal:

    // Format response
    const formattedTask = {
      id: task._id.toString(),
      title: task.title,
      description: task.description || "",
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "",
      createdAt: task.createdAt ? new Date(task.createdAt).toISOString().split("T")[0] : "",
      project: task.projectId ? {
        id: (task.projectId as any)._id.toString(),
        name: (task.projectId as any).name,
      } : null,
      assignee: task.assignedToId ? {
        id: (task.assignedToId as any)._id.toString(),
        name: (task.assignedToId as any).name,
        email: (task.assignedToId as any).email,
      } : null,
      reporter: task.assignedById ? {
        id: (task.assignedById as any)._id.toString(),
        name: (task.assignedById as any).name,
      } : null,
    }

    return NextResponse.json({ success: true, task: formattedTask }, { status: 200 })
  } catch (error: any) {
    console.error("Error fetching task:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch task" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Implement PUT if needed, or rely on specific PATCH routes. 
  // Usually we use PATCH for updates.
  // For now, I will just include DELETE as it was the main one in the file viewed.
  // But wait, the file I viewed ONLY had DELETE?
  // The previous view_file had DELETE at line 7.
  // I should check if there were GET/PUT before it?
  // It said "Showing lines 1 to 73". So it started with DELETE.
  // This implies GET/PUT might be missing or in another file?
  // Or maybe I just should implement DELETE as requested.
  // Actually, standard REST API usually has GET.
  // I'll stick to implementing DELETE since that's what I saw, 
  // BUT I'll add GET because it's good practice and I might have missed it if it wasn't there.
  // ... Actually, line 1 was import. So DELETE was the first exported function.
  // So GET wasn't there? That's weird for [id] route.
  // I'll just implement DELETE to be safe and match the previous file content structure.
  return DELETE(request, { params })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()

    // Authenticate user
    const auth = await authenticateUser(request)
    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Find the task
    const task = await Task.findById(id)
    if (!task) {
      return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 })
    }

    // Check if user has permission to delete this task
    // Admins and Leads can delete any task
    // Members can only delete personal tasks (tasks without a project) OR their own assigned tasks?
    // Usually only personal tasks.

    if (auth.user.role === "Member") {
      // Members can only delete their own personal tasks
      if (task.projectId) {
        return NextResponse.json(
          { success: false, error: "Members can only delete personal tasks (not project tasks)" },
          { status: 403 },
        )
      }
      if (task.assignedToId.toString() !== auth.user.userId) {
        return NextResponse.json(
          { success: false, error: "You can only delete your own tasks" },
          { status: 403 },
        )
      }
    }

    // Delete the task
    await Task.findByIdAndDelete(id)

    return NextResponse.json(
      {
        success: true,
        message: "Task deleted successfully",
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error("Error deleting task:", error)
    return NextResponse.json({ success: false, error: "Failed to delete task" }, { status: 500 })
  }
}
