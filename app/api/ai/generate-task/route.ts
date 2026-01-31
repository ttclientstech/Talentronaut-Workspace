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

    // Check if user is Admin
    if (auth.user.role !== "Admin") {
      return NextResponse.json({ success: false, error: "Only Admins can use AI task generation" }, { status: 403 })
    }

    const body = await request.json()
    const { prompt } = body

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return NextResponse.json({ success: false, error: "Prompt is required" }, { status: 400 })
    }

    // Fetch all projects (Global)
    const projects = await Project.find({})
      .select("_id name description leadId")
      .populate("leadId", "name email")
      .lean()

    if (!projects || projects.length === 0) {
      return NextResponse.json(
        { success: false, error: "No projects found. Create a project first." },
        { status: 400 }
      )
    }

    // Build projects context for AI
    const projectsContext = projects
      .map((p: any) => {
        const leadName = p.leadId?.name || "Unknown Lead"
        return `- Project: "${p.name}" (ID: ${p._id})\n  Description: ${p.description || "No description"}\n  Lead: ${leadName}`
      })
      .join("\n\n")

    // Create AI prompt
    const aiPrompt = `You are an AI assistant helping an Admin delegate tasks to project leads in a professional work management system.

AVAILABLE PROJECTS:
${projectsContext}

ADMIN'S REQUEST:
"${prompt}"

YOUR ROLE:
You need to transform the admin's brief request into a comprehensive, actionable task that the project lead can understand and execute without needing to ask for clarification.

INSTRUCTIONS:
1. Carefully analyze the admin's request to identify which project this task belongs to
2. Match the request to the most relevant project based on project name, description, or context
3. Create a detailed, professional task description that includes:
   - WHAT needs to be done (specific deliverables and requirements)
   - WHY it's needed (context and business value)
   - HOW to approach it (technical considerations, best practices, or key steps)
   - WHO might be involved (if team collaboration is needed)
   - WHEN it should be completed (if urgency is mentioned)
4. Make the description detailed enough for the lead to:
   - Understand the full scope without asking questions
   - Break it down into subtasks for team members
   - Estimate effort and resources needed
   - Plan the implementation approach
5. Use professional language suitable for a project lead
6. Determine priority based on keywords: "urgent", "asap", "critical", "important" = High; "soon", "needed" = Medium; default = Low
7. If multiple projects could match, choose the most relevant one

DESCRIPTION GUIDELINES:
- Write 4-6 detailed sentences (not 2-4)
- Include technical context and business rationale
- Mention any dependencies or considerations
- Be specific about expected outcomes
- Use clear, professional language
- CRITICAL: Keep description under 800 characters (database limit is 1000)

RESPOND ONLY WITH VALID JSON (no markdown, no code blocks, just pure JSON):
{
  "projectId": "the MongoDB ObjectId of the matched project",
  "projectName": "the name of the project",
  "leadId": "the MongoDB ObjectId of the project's lead",
  "leadName": "the name of the lead",
  "taskTitle": "a clear, professional task title (max 100 chars)",
  "taskDescription": "a comprehensive, detailed description with WHAT, WHY, HOW, WHO, WHEN - written for a project lead to understand completely (4-6 sentences, max 800 characters)",
  "priority": "High" | "Medium" | "Low",
  "confidence": a number between 0-100 indicating how confident you are about the project match,
  "reasoning": "brief explanation of why you chose this project and priority"
}`

    // Call Gemini API - Use gemini-1.5-flash for better rate limits
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

    const result = await model.generateContent(aiPrompt)
    const response = result.response
    const text = response.text()

    // Parse AI response
    let aiResponse
    try {
      // Clean up response - remove markdown code blocks if present
      const cleanText = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
      aiResponse = JSON.parse(cleanText)
    } catch (parseError) {
      console.error("[AI_TASK_GEN] Failed to parse AI response:", parseError)
      return NextResponse.json(
        { success: false, error: "AI generated invalid response. Please try rephrasing your prompt." },
        { status: 500 }
      )
    }

    // Validate AI response
    if (
      !aiResponse.projectId ||
      !aiResponse.taskTitle ||
      !aiResponse.taskDescription ||
      !aiResponse.priority
    ) {
      return NextResponse.json(
        { success: false, error: "AI response missing required fields" },
        { status: 500 }
      )
    }

    // Verify project exists and get the actual lead from the project
    const verifiedProject = projects.find((p: any) => p._id.toString() === aiResponse.projectId)
    if (!verifiedProject) {
      return NextResponse.json(
        { success: false, error: "AI selected an invalid project. Please try again." },
        { status: 500 }
      )
    }

    // Use the actual leadId from the verified project, not from AI response
    const leadData = verifiedProject.leadId as any
    const actualLeadId = leadData?._id || leadData
    const actualLeadName = leadData?.name || "Unknown Lead"

    if (!actualLeadId) {
      return NextResponse.json(
        { success: false, error: `Project "${verifiedProject.name}" has no lead assigned. Please assign a lead first.` },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        task: {
          projectId: verifiedProject._id.toString(),
          projectName: verifiedProject.name,
          leadId: actualLeadId.toString(),
          leadName: actualLeadName,
          taskTitle: aiResponse.taskTitle,
          taskDescription: aiResponse.taskDescription,
          priority: aiResponse.priority,
          confidence: aiResponse.confidence || 80,
          reasoning: aiResponse.reasoning || "Auto-generated by AI",
        },
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("[AI_TASK_GEN] Error:", error)

    // Handle rate limit errors specifically
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
