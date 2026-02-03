import { NextRequest, NextResponse } from "next/server"
import { authenticateUser } from "@/lib/middleware/auth"
import Project from "@/lib/models/Project"
import connectDB from "@/lib/db/mongodb"
import mongoose from "mongoose"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectDB()
        const { id } = await params

        const auth = await authenticateUser(request)
        if (!auth.isAuthenticated) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        // Defaults handled by Schema if simple, but good to be explicit for a 'New Row'
        const newPhase = {
            phase: body.phase || "New Phase",
            date: body.date || new Date().toLocaleDateString("en-GB"),
            description: body.description || "Description",
            platform: body.platform || "Backend",
            status: body.status || "Pending"
        }

        const project = await Project.findByIdAndUpdate(
            id,
            { $push: { phases: newPhase } },
            { new: true } // Return updated doc
        )

        if (!project) {
            return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 })
        }

        // Return the newly added phase (last in the array)
        const addedPhase = project.phases[project.phases.length - 1];

        return NextResponse.json({ success: true, phase: addedPhase })

    } catch (error) {
        console.error("Error adding phase:", error)
        return NextResponse.json({ success: false, error: "Failed to add phase" }, { status: 500 })
    }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectDB()
        const { id } = await params

        const auth = await authenticateUser(request)
        if (!auth.isAuthenticated) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { phaseId, updates } = body;

        if (!phaseId) {
            return NextResponse.json({ success: false, error: "Phase ID required" }, { status: 400 })
        }

        // Update the specific element in the array
        // We explicitly set fields to avoid overwriting the whole object if partial updates
        const updateQuery: any = {};
        for (const [key, value] of Object.entries(updates)) {
            updateQuery[`phases.$.${key}`] = value;
        }

        const project = await Project.findOneAndUpdate(
            { _id: id, "phases._id": phaseId },
            { $set: updateQuery },
            { new: true }
        )

        if (!project) {
            return NextResponse.json({ success: false, error: "Project or Phase not found" }, { status: 404 })
        }

        return NextResponse.json({ success: true, phases: project.phases })

    } catch (error) {
        console.error("Error updating phase:", error)
        return NextResponse.json({ success: false, error: "Failed to update phase" }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectDB()
        const { id } = await params

        const auth = await authenticateUser(request)
        if (!auth.isAuthenticated) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { phaseId } = body;

        if (!phaseId) {
            return NextResponse.json({ success: false, error: "Phase ID required" }, { status: 400 })
        }

        const project = await Project.findByIdAndUpdate(
            id,
            { $pull: { phases: { _id: phaseId } } },
            { new: true }
        )

        if (!project) {
            return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 })
        }

        return NextResponse.json({ success: true, message: "Phase deleted" })

    } catch (error) {
        console.error("Error deleting phase:", error)
        return NextResponse.json({ success: false, error: "Failed to delete phase" }, { status: 500 })
    }
}
