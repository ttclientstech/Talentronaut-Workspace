import { NextRequest, NextResponse } from "next/server"
import { authenticateUser } from "@/lib/middleware/auth"
import Task from "@/lib/models/Task"
import User from "@/lib/models/User"
import connectDB from "@/lib/db/mongodb"
import { GoogleGenerativeAI } from "@google/generative-ai"

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

interface SubTask {
  title: string
  description: string
  assignedTo: string
  assignedToName: string
  priority: "High" | "Medium" | "Low"
  matchScore: number
  reasoning: string
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    // Authenticate user
    const auth = await authenticateUser(request)
    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is Lead or Admin globally
    if (!["Lead", "Admin"].includes(auth.user.role)) {
      return NextResponse.json({ success: false, error: "Only Leads and Admins can divide tasks" }, { status: 403 })
    }

    const body = await request.json()
    const { taskId } = body

    if (!taskId) {
      return NextResponse.json({ success: false, error: "Task ID is required" }, { status: 400 })
    }

    // Fetch the task
    const task = await Task.findById(taskId).populate("projectId")
    if (!task) {
      return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 })
    }

    // Ensure task has a project
    if (!task.projectId) {
      return NextResponse.json(
        { success: false, error: "Personal tasks cannot be divided. Only project tasks can be divided." },
        { status: 400 }
      )
    }

    const project = task.projectId as any

    // Verify user is the lead of this project (or admin)
    // Simplification: Allow Admin to divide any task, and Lead to divide only their project tasks
    if (auth.user.role === "Lead" && project.leadId?.toString() !== auth.user.userId) {
      return NextResponse.json(
        { success: false, error: "You can only divide tasks in your own projects" },
        { status: 403 }
      )
    }

    // Fetch project members with their skills (Global fetch based on project membership)
    const projectMembers = await User.find({
      _id: { $in: project.memberIds },
    }).select("name email skills")

    if (!projectMembers || projectMembers.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No team members found in this project. Add members to the project first.",
        },
        { status: 400 }
      )
    }

    // Build team context for AI
    const teamContext = projectMembers
      .map((member: any) => {
        const skills = member.skills && member.skills.length > 0 ? member.skills.join(", ") : "No skills listed"
        return `- ${member.name} (ID: ${member._id})\n  Skills: ${skills}`
      })
      .join("\n\n")

    // Get current user details for fallback
    const currentUser = await User.findById(auth.user.userId).select("name")

    // Also include the lead/admin as fallback
    const leadInfo = `\n\n- ${currentUser?.name || "CurrentUser"} (ID: ${auth.user.userId}) [PROJECT LEAD/ADMIN]\n  Role: Project Lead (assign as fallback if no suitable match)`

    // Create AI prompt
    const aiPrompt = `You are an AI assistant helping a Project Lead divide a complex task into subtasks and assign them to team members based on their skills.

PROJECT: ${project.name}
PROJECT DESCRIPTION: ${project.description || "No description"}

MAIN TASK TO DIVIDE:
Title: "${task.title}"
Description: "${task.description || "No description"}"
Priority: ${task.priority}

AVAILABLE TEAM MEMBERS:
${teamContext}${leadInfo}

YOUR ROLE:
Divide the main task into 2-5 specific, actionable subtasks and assign each to the most suitable team member based on their skills.

INSTRUCTIONS:
1. Analyze the main task and break it down into logical, independent subtasks
2. Each subtask should be:
   - Specific and actionable (not vague)
   - Completable by one person
   - Clear in scope and deliverables
3. Match each subtask to team members based on:
   - Skill relevance (primary factor)
   - Task complexity
   - Equal workload distribution
4. For each assignment, provide:
   - Match score (0-100): how well the member's skills match the subtask
   - Reasoning: why this member is assigned
5. If no team member has relevant skills for a subtask, assign it to the Project Lead
6. Prioritize subtasks based on dependencies and urgency
7. Create 2-5 subtasks (not more, not less)

SUBTASK GUIDELINES:
- Title: Clear, concise (max 80 chars)
- Description: Detailed with WHAT, WHY, HOW (3-4 sentences, max 800 characters)
- Priority: Maintain parent task priority or adjust if subtask is more/less urgent
- CRITICAL: Keep description under 800 characters (database limit is 1000)

RESPOND ONLY WITH VALID JSON (no markdown, no code blocks):
{
  "subtasks": [
    {
      "title": "specific subtask title (max 80 chars)",
      "description": "detailed description with WHAT needs to be done, WHY it's important, and HOW to approach it (max 800 characters)",
      "assignedTo": "MongoDB ObjectId of the assigned team member",
      "assignedToName": "name of the assigned team member",
      "priority": "High" | "Medium" | "Low",
      "matchScore": number between 0-100 indicating skill match quality,
      "reasoning": "why this member was chosen for this subtask"
    }
  ]
}`

    // Call Gemini API
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

    const result = await model.generateContent(aiPrompt)
    const response = result.response
    const text = response.text()

    // Parse AI response
    let aiResponse: { subtasks: SubTask[] }
    try {
      const cleanText = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
      aiResponse = JSON.parse(cleanText)
    } catch (parseError) {
      console.error("[AI_DIVIDE_TASK] Failed to parse AI response:", parseError)
      return NextResponse.json(
        { success: false, error: "AI generated invalid response. Please try again." },
        { status: 500 }
      )
    }

    // Validate AI response
    if (!aiResponse.subtasks || !Array.isArray(aiResponse.subtasks) || aiResponse.subtasks.length === 0) {
      return NextResponse.json({ success: false, error: "AI did not generate valid subtasks" }, { status: 500 })
    }

    // Validate each subtask
    const validSubtasks = aiResponse.subtasks.filter((st) => {
      return st.title && st.description && st.assignedTo && st.priority
    })

    if (validSubtasks.length === 0) {
      return NextResponse.json({ success: false, error: "No valid subtasks generated" }, { status: 500 })
    }

    return NextResponse.json(
      {
        success: true,
        mainTask: {
          id: task._id.toString(),
          title: task.title,
          description: task.description,
          priority: task.priority,
        },
        subtasks: validSubtasks,
        project: {
          id: project._id.toString(),
          name: project.name,
        },
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("[AI_DIVIDE_TASK] Error:", error)

    // Handle rate limit errors
    if (error.status === 429) {
      return NextResponse.json(
        {
          success: false,
          error: "API rate limit exceeded. Please try again in a few moments.",
        },
        { status: 429 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to divide task with AI",
      },
      { status: 500 }
    )
  }
}
