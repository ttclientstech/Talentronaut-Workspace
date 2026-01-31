import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses"

const sesClient = new SESClient({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    },
})

export async function sendEmail(to: string, subject: string, message: string) {
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
        console.warn("AWS Credentials not found. Mocking email send.")
        console.log(`[MOCK EMAIL] To: ${to}, Subject: ${subject}, Message: ${message}`)
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
