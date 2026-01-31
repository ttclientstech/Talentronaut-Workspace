import { NextRequest, NextResponse } from "next/server"
import { authenticateUser } from "@/lib/middleware/auth"
import Project from "@/lib/models/Project"
import connectDB from "@/lib/db/mongodb"
import { GoogleGenerativeAI } from "@google/generative-ai"

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    // Authenticate user
    const auth = await authenticateUser(request)
    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is Lead (global role check)
    if (auth.user.role !== "Lead") {
      return NextResponse.json({ success: false, error: "Only Leads can use this feature" }, { status: 403 })
    }

    const body = await request.json()
    const { prompt } = body

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return NextResponse.json({ success: false, error: "Prompt is required" }, { status: 400 })
    }

    // Find projects where the user is the leads
    const projects = await Project.find({
      leadId: auth.user.userId,
    }).populate("memberIds", "name email skills")

    if (!projects || projects.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "You don't lead any projects yet. Create or join a project first.",
        },
        { status: 400 }
      )
    }

    // Build project and team member context for AI
    const projectsContext = projects
      .map((p: any) => {
        const members = p.memberIds
          ?.map((m: any) => {
            const skills = m.skills && m.skills.length > 0 ? m.skills.join(", ") : "No skills listed"
            return `    • ${m.name} (ID: ${m._id}) - Skills: ${skills}`
          })
          .join("\n")

        return `- Project: "${p.name}" (ID: ${p._id})\n  Description: ${p.description || "No description"}\n  Team Members:\n${members || "    No members assigned"}`
      })
      .join("\n\n")

    // Create AI prompt
    const aiPrompt = `You are an AI assistant helping a Project Lead delegate tasks to team members based on their skills and the task requirements.

LEAD'S PROJECTS AND TEAM MEMBERS:
${projectsContext}

LEAD'S REQUEST:
"${prompt}"

YOUR ROLE:
You need to transform the lead's brief request into a comprehensive, actionable task and assign it to the most suitable team member based on their skills.

INSTRUCTIONS:
1. Carefully analyze the lead's request to identify which project and which team member this task belongs to
2. Match the task to the most relevant project based on project name, description, or context
3. Analyze team member skills to find the best match for this task
4. Create a detailed, professional task description that includes:
   - WHAT needs to be done (specific deliverables and requirements)
   - WHY it's needed (context and business value)
   - HOW to approach it (technical considerations, best practices, or key steps)
   - WHEN it should be completed (if urgency is mentioned)
5. Make the description detailed enough for the team member to:
   - Understand the full scope without asking questions
   - Know what deliverables are expected
   - Understand the technical requirements
   - Plan the implementation approach
6. Use professional language suitable for a team member
7. Determine priority based on keywords: "urgent", "asap", "critical", "important" = High; "soon", "needed" = Medium; default = Low
8. Calculate a match score (0-100) based on how well the member's skills align with the task

DESCRIPTION GUIDELINES:
- Write 4-6 detailed sentences
- Include technical context and business rationale
- Mention any dependencies or considerations
- Be specific about expected outcomes
- Use clear, professional language
- CRITICAL: Keep description under 800 characters (database limit is 1000)

RESPOND ONLY WITH VALID JSON (no markdown, no code blocks, just pure JSON):
{
  "projectId": "the MongoDB ObjectId of the matched project",
  "projectName": "the name of the project",
  "memberId": "the MongoDB ObjectId of the best-matched team member",
  "memberName": "the name of the team member",
  "taskTitle": "a clear, professional task title (max 100 chars)",
  "taskDescription": "a comprehensive, detailed description with WHAT, WHY, HOW, WHEN - written for a team member to understand completely (4-6 sentences, max 800 characters)",
  "priority": "High" | "Medium" | "Low",
  "matchScore": a number between 0-100 indicating how well the member's skills match the task,
  "reasoning": "brief explanation of why you chose this team member and priority"
}`

    // Call Gemini API
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

    const result = await model.generateContent(aiPrompt)
    const response = result.response
    const text = response.text()

    // Parse AI response
    let aiResponse: any
    try {
      const cleanText = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
      aiResponse = JSON.parse(cleanText)
    } catch (parseError) {
      return NextResponse.json(
        { success: false, error: "AI generated invalid response. Please try again." },
        { status: 500 }
      )
    }

    // Validate AI response
    if (
      !aiResponse.projectId ||
      !aiResponse.memberId ||
      !aiResponse.taskTitle ||
      !aiResponse.taskDescription ||
      !aiResponse.priority
    ) {
      return NextResponse.json(
        { success: false, error: "AI response missing required fields" },
        { status: 500 }
      )
    }

    // Verify project exists and lead owns it
    const verifiedProject = projects.find((p: any) => p._id.toString() === aiResponse.projectId)
    if (!verifiedProject) {
      return NextResponse.json(
        { success: false, error: "AI selected an invalid project. Please try again." },
        { status: 500 }
      )
    }

    // Verify member exists in the project
    const verifiedMember = verifiedProject.memberIds?.find(
      (m: any) => (m._id || m).toString() === aiResponse.memberId
    ) as any
    if (!verifiedMember) {
      return NextResponse.json(
        { success: false, error: "AI selected a team member not in this project. Please try again." },
        { status: 500 }
      )
    }

    // Extract member data (handle both populated and non-populated cases)
    const memberId = (verifiedMember._id || verifiedMember).toString()
    const memberName = verifiedMember.name || "Unknown Member"

    return NextResponse.json(
      {
        success: true,
        task: {
          projectId: verifiedProject._id.toString(),
          projectName: verifiedProject.name,
          memberId: memberId,
          memberName: memberName,
          taskTitle: aiResponse.taskTitle,
          taskDescription: aiResponse.taskDescription,
          priority: aiResponse.priority,
          matchScore: aiResponse.matchScore || 80,
          reasoning: aiResponse.reasoning || "Auto-generated by AI",
        },
      },
      { status: 200 }
    )
  } catch (error: any) {
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
        error: error.message || "Failed to generate task with AI",
      },
      { status: 500 }
    )
  }
}
