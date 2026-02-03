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

        // Run queries in parallel for efficiency
        const [
            memberCount,
            projectCount,
            activeProjectsCount,
            taskCount,
            pendingTasksCount,
            completedTasksCount,
            aiAssignmentsCount,
            recentProjectsRaw
        ] = await Promise.all([
            User.countDocuments({}),
            Project.countDocuments({}),
            Project.countDocuments({ status: { $nin: ["Closed", "Not Started"] } }), // Defining Active as not closed or not started
            Task.countDocuments({}),
            Task.countDocuments({ status: { $ne: "Done" } }),
            Task.countDocuments({ status: "Done" }),
            Task.countDocuments({ isAIAssigned: true }),
            Project.find({})
                .sort({ createdAt: -1 })
                .limit(4)
                .populate("leadId", "name")
                .populate("memberIds", "name")
                .lean()
        ])

        // Process recent projects to calculate progress (same logic as projects/route.ts)
        const recentProjects = await Promise.all(
            recentProjectsRaw.map(async (project: any) => {
                const totalTasks = await Task.countDocuments({ projectId: project._id })
                const completedTasks = await Task.countDocuments({ projectId: project._id, status: "Done" })
                const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

                // Determine status (simple mapping or stick to DB value if maintained correctly)
                // Using DB value for speed, but could re-calculate if needed.
                // The project/route.ts calculates status dynamically, let's trust the DB val for now or just return what we have.
                // Actually, dashboard expects strings like "Active", "In Progress".

                return {
                    id: project._id.toString(),
                    name: project.name,
                    lead: project.leadId?.name || "Unknown",
                    status: project.status,
                    progress: progress
                }
            })
        )

        // Construct response
        const stats = {
            success: true,
            organization: {
                id: "org-1", // Mock or single-tenant default
                name: "Talentronaut",
                handle: "talentronaut",
                inviteCode: "TAL-123", // You might want to fetch this from a config or default admin user if stored there
                adminId: "admin-1"
            },
            statistics: {
                memberCount,
                projectCount,
                activeProjects: activeProjectsCount,
                taskCount,
                pendingTasks: pendingTasksCount,
                completedTasks: completedTasksCount,
                aiAssignments: aiAssignmentsCount
            },
            recentProjects
        }

        return NextResponse.json(stats, { status: 200 })

    } catch (error: any) {
        console.error("Error fetching dashboard stats:", error)
        return NextResponse.json({ success: false, error: "Failed to fetch dashboard stats" }, { status: 500 })
    }
}
