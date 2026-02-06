import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/db/mongodb"
import Team from "@/lib/models/Team"
import User from "@/lib/models/User"
import { authenticateUser } from "@/lib/middleware/auth"

// GET: Fetch all teams
export async function GET(req: NextRequest) {
    try {
        const auth = await authenticateUser(req)
        if (!auth.isAuthenticated || !auth.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        await connectDB()

        const teams = await Team.find({})
            .populate("leader", "name email profilePicture")
            .populate("members", "name email profilePicture role")
            .sort({ createdAt: -1 })

        return NextResponse.json({ success: true, teams })
    } catch (error: any) {
        console.error("Error fetching teams:", error)
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
    }
}

// POST: Create a new team (Admin only)
export async function POST(req: NextRequest) {
    try {
        const auth = await authenticateUser(req)
        if (!auth.isAuthenticated || !auth.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Only Admin can create teams
        if (auth.user?.role !== "Admin") {
            return NextResponse.json({ error: "Forbidden: Only Admins can create teams" }, { status: 403 })
        }

        await connectDB()

        const body = await req.json()
        const { name, leaderId, memberIds, description } = body

        if (!name) {
            return NextResponse.json({ error: "Team name is required" }, { status: 400 })
        }

        // Check if team name exists
        const existingTeam = await Team.findOne({ name })
        if (existingTeam) {
            return NextResponse.json({ error: "Team name already exists" }, { status: 400 })
        }

        const newTeam = await Team.create({
            name,
            leader: leaderId || undefined,
            members: memberIds || [],
            description,
        })

        const populatedTeam = await Team.findById(newTeam._id)
            .populate("leader", "name email profilePicture")
            .populate("members", "name email profilePicture role")

        return NextResponse.json({ success: true, team: populatedTeam, message: "Team created successfully" })
    } catch (error: any) {
        console.error("Error creating team:", error)
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
    }
}
