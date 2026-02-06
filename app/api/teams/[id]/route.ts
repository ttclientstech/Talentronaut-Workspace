import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/db/mongodb"
import Team from "@/lib/models/Team"
import { authenticateUser } from "@/lib/middleware/auth"

// PATCH: Update team (Add/Remove members, Change leader)
export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const auth = await authenticateUser(req)
        if (!auth.isAuthenticated || !auth.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const params = await props.params
        const { id } = params
        await connectDB()

        const team = await Team.findById(id)
        if (!team) {
            return NextResponse.json({ error: "Team not found" }, { status: 404 })
        }

        const { user } = auth
        const body = await req.json()
        const { name, leaderId, memberIds, description } = body

        // PERMISSION CHECK
        const isAdmin = user?.role === "Admin"
        const isLeaderOfTeam = team.leader?.toString() === user?.userId

        // - Admin can update everything
        // - Leader of THIS team can only update members
        // - Others cannot update
        if (!isAdmin && !isLeaderOfTeam) {
            return NextResponse.json({ error: "Forbidden: You do not have permission to modify this team" }, { status: 403 })
        }

        // Logic for Leader: Prevent them from changing name, leader, description if unauthorized
        // (Though simple implementation might just ignore fields, explicit rejection is safer)
        if (!isAdmin && isLeaderOfTeam) {
            if (name || leaderId || description) {
                // Optionally we can just ignore these, but for strictness:
                // return NextResponse.json({ error: "Leaders can only manage team members" }, { status: 403 })
            }
        }

        // Build update object
        const updateData: any = {}

        if (isAdmin) {
            if (name) updateData.name = name
            if (leaderId !== undefined) updateData.leader = leaderId
            if (description !== undefined) updateData.description = description
        }

        // Both Admin and Leader can update members
        if (memberIds) {
            updateData.members = memberIds
        }

        const updatedTeam = await Team.findByIdAndUpdate(id, updateData, { new: true })
            .populate("leader", "name email profilePicture")
            .populate("members", "name email profilePicture role")

        return NextResponse.json({ success: true, team: updatedTeam, message: "Team updated successfully" })
    } catch (error: any) {
        console.error("Error updating team:", error)
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
    }
}

// DELETE: Delete team (Admin only)
export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const auth = await authenticateUser(req)
        if (!auth.isAuthenticated || !auth.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        if (auth.user?.role !== "Admin") {
            return NextResponse.json({ error: "Forbidden: Only Admins can delete teams" }, { status: 403 })
        }

        const params = await props.params
        const { id } = params
        await connectDB()

        const deletedTeam = await Team.findByIdAndDelete(id)
        if (!deletedTeam) {
            return NextResponse.json({ error: "Team not found" }, { status: 404 })
        }

        return NextResponse.json({ success: true, message: "Team deleted successfully" })
    } catch (error: any) {
        console.error("Error deleting team:", error)
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
    }
}
