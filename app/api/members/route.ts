import { NextRequest, NextResponse } from "next/server"
import { authenticateUser } from "@/lib/middleware/auth"
import User from "@/lib/models/User"
import Project from "@/lib/models/Project"
import connectDB from "@/lib/db/mongodb"

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    // Authenticate user
    const auth = await authenticateUser(request)
    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // In single company mode, we fetch ALL users
    // If needed, we can exclude deleted users or inactive ones
    const users = await User.find({})
      .select("name email role skills")
      .lean()

    // For each user, fetch their projects
    const usersWithProjects = await Promise.all(
      users.map(async (user: any) => {
        // Find projects where user is a member or lead
        // Note: Project model should have memberIds array and leadId field
        const projects = await Project.find({
          $or: [{ leadId: user._id }, { memberIds: user._id }],
        })
          .select("name")
          .lean()

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          skills: user.skills || [],
          projects: projects.map((p: any) => p.name),
        }
      }),
    )

    return NextResponse.json(
      {
        success: true,
        members: usersWithProjects,
        count: usersWithProjects.length,
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error("Error fetching members:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch members" }, { status: 500 })
  }
}
