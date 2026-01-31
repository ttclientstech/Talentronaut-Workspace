import { NextRequest, NextResponse } from "next/server"
import { authenticateUser } from "@/lib/middleware/auth"
import Project from "@/lib/models/Project"
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
      .select("memberIds name")
      .populate("memberIds", "name email role skills")
      .lean()

    // Extract unique members from all lead projects (only Members role)
    const memberMap = new Map()

    projects.forEach((project: any) => {
      if (project.memberIds && Array.isArray(project.memberIds)) {
        project.memberIds.forEach((member: any) => {
          // Only include users with "Member" role
          if (member && member.role === "Member") {
            const memberId = member._id.toString()

            if (memberMap.has(memberId)) {
              // Add project to existing member's project list
              const existingMember = memberMap.get(memberId)
              existingMember.projects.push(project.name)
            } else {
              // Add new member
              memberMap.set(memberId, {
                id: memberId,
                name: member.name,
                email: member.email,
                role: member.role,
                skills: member.skills || [],
                projects: [project.name],
              })
            }
          }
        })
      }
    })

    // Convert map to array
    const members = Array.from(memberMap.values())

    return NextResponse.json(
      {
        success: true,
        members,
        count: members.length,
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error("Error fetching lead project members:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch team members" }, { status: 500 })
  }
}
