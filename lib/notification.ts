import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses"

const sesClient = new SESClient({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    },
})

export async function sendEmail(to: string, subject: string, message: string, html?: string) {
    // Check if we should skip actual email sending (for development/testing)
    const skipEmailSending = process.env.SEND_ACTUAL_EMAILS !== 'true'

    if (skipEmailSending || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
        console.log("\n" + "=".repeat(80))
        console.log("📧 [EMAIL - " + (skipEmailSending ? "PREVIEW MODE" : "NO AWS CREDENTIALS") + "]")
        console.log("=".repeat(80))
        console.log(`To: ${to}`)
        console.log(`Subject: ${subject}`)
        console.log(`Message: ${message}`)
        if (html) {
            console.log(`HTML Length: ${html.length} characters`)
            console.log(`Preview: ${html.substring(0, 200)}...`)
        }
        console.log("=".repeat(80) + "\n")
        console.log("💡 TIP: Set SEND_ACTUAL_EMAILS=true in .env to send real emails via AWS SES\n")
        return Promise.resolve(true)
    }

    const params = {
        Source: "credentials@talentronaut.in",
        Destination: {
            ToAddresses: [to],
        },
        Message: {
            Subject: {
                Data: subject,
            },
            Body: {
                Text: {
                    Data: message,
                },
                ...(html && {
                    Html: {
                        Data: html,
                    },
                }),
            },
        },
    }

    try {
        const command = new SendEmailCommand(params)
        await sesClient.send(command)
        console.log(`Email sent to ${to}`)
        return true
    } catch (error) {
        console.error("Error sending email via SES:", error)
        return false
    }
}

export async function sendSMS(to: string, message: string) {
    // In a real app, use Twilio, AWS SNS, etc.
    console.log(`[MOCK SMS] To: ${to}, Message: ${message}`)
    return Promise.resolve(true)
}
