import { NextRequest, NextResponse } from "next/server"
import { authenticateUser } from "@/lib/middleware/auth"
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

    const user = await User.findById(auth.user.userId).select("name")

    // Fetch tasks assigned to the current user (Global)
    const tasks = await Task.find({
      assignedToId: auth.user.userId,
    })
      .populate("projectId", "name")
      .populate("assignedById", "name email role")
      .sort({ dueDate: 1, createdAt: -1 })
      .lean()

    // Format tasks for frontend
    const formattedTasks = tasks.map((task: any) => ({
      id: task._id.toString(),
      title: task.title,
      description: task.description || "",
      assignee: user?.name || "Unknown",
      assignedBy: task.assignedById?.name || "Unknown",
      assignedByEmail: task.assignedById?.email || "",
      assignedByRole: task.assignedById?.role || "",
      assignedById: task.assignedById?._id?.toString() || "",
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "",
      skills: task.skills || [],
      project: task.projectId?.name || "Personal", // Show "Personal" for tasks without project
      projectId: task.projectId?._id?.toString() || "",
      subtasks: task.subtasks || [],
      isAIAssigned: task.isAIAssigned || false,
      createdAt: task.createdAt ? new Date(task.createdAt).toISOString().split("T")[0] : "",
    }))

    return NextResponse.json(
      {
        success: true,
        tasks: formattedTasks,
        count: formattedTasks.length,
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error("Error fetching tasks:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch tasks" }, { status: 500 })
  }
}
