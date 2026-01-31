import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/db/mongodb"
import User from "@/lib/models/User"
import { verifyToken } from "@/lib/utils/jwt"
import { sendEmail, sendSMS } from "@/lib/notification"

// Helper to check admin auth
async function checkAdmin(request: NextRequest) {
  const token = request.cookies.get("token")?.value
  if (!token) return null

  const decoded = verifyToken(token)
  if (!decoded) return null

  if (decoded.role !== "Admin") return null

  return decoded
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    const admin = await checkAdmin(request)

    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { id: userId } = await params
    const body = await request.json()

    const { method } = body // 'email' or 'phone'

    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    if (!user.accessCode) {
      return NextResponse.json({ success: false, error: "User has no access code" }, { status: 400 })
    }

    if (method === "email") {
      if (!user.email) {
        return NextResponse.json({ success: false, error: "User has no email" }, { status: 400 })
      }
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Access Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    
    <!-- Header Logo -->
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #D4503A; font-family: 'Playfair Display', serif; font-size: 28px; margin: 0; letter-spacing: -0.5px;">Talentronaut</h1>
      <p style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin-top: 5px;">Workspace</p>
    </div>

    <!-- Main Card -->
    <div style="background-color: #ffffff; border-radius: 16px; padding: 40px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025); border-top: 6px solid #D4503A;">
      
      <h2 style="color: #111827; font-size: 24px; font-weight: 700; margin-top: 0; margin-bottom: 16px; text-align: center;">Welcome to the Team</h2>
      
      <p style="color: #4b5563; font-size: 16px; line-height: 24px; text-align: center; margin-bottom: 32px;">
        You've been invited to join the Talentronaut workspace. Use the access code below to securely log in.
      </p>

      <!-- Access Code Box -->
      <div style="background-color: #FFF5F4; border: 2px dashed #D4503A; border-radius: 12px; padding: 32px; text-align: center; margin-bottom: 32px;">
        <span style="font-family: 'Courier New', Courier, monospace; color: #D4503A; font-size: 36px; font-weight: 700; letter-spacing: 8px; display: block;">${user.accessCode}</span>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 12px; margin-bottom: 0;">This code is unique to your account.</p>
      </div>

      <!-- CTA Button -->
      <div style="text-align: center; margin-bottom: 32px;">
        <a href="https://workspace.talentronaut.in/login" style="background-color: #D4503A; color: #ffffff; padding: 14px 32px; border-radius: 50px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(212, 80, 58, 0.25);">Login to Workspace</a>
      </div>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />

      <p style="color: #6b7280; font-size: 14px; text-align: center; margin: 0;">
        If you didn't request this code, please ignore this email or contact your administrator.
      </p>
    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 30px;">
      <p style="color: #9ca3af; font-size: 12px;">&copy; ${new Date().getFullYear()} Talentronaut. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
            `

      await sendEmail(
        user.email,
        "Your Access Code - Talentronaut",
        `Welcome! Your access code to login is: ${user.accessCode}`,
        htmlContent
      )
    } else if (method === "phone") {
      if (!user.phoneNumber) {
        return NextResponse.json({ success: false, error: "User has no phone number" }, { status: 400 })
      }
      await sendSMS(user.phoneNumber, `Welcome! Your access code is: ${user.accessCode}`)
    } else {
      return NextResponse.json({ success: false, error: "Invalid method" }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: `Credentials sent via ${method}` })

  } catch (error: any) {
    console.error("Send credentials error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
