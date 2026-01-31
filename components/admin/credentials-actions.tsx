"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Mail, MessageSquare, Loader2 } from "lucide-react"

interface CredentialsActionsProps {
    userId: string
    userName: string
    accessCode?: string
    email?: string
    phoneNumber?: string
}

export function CredentialsActions({ userId, userName, accessCode, email, phoneNumber }: CredentialsActionsProps) {
    const [loading, setLoading] = useState<string | null>(null)

    const sendCredentials = async (method: "email" | "phone") => {
        setLoading(method)
        try {
            const response = await fetch(`/api/admin/users/${userId}/send-credentials`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ method }),
            })

            const data = await response.json()
            if (!response.ok) throw new Error(data.error || "Failed to send")

            alert(data.message)
        } catch (error: any) {
            alert(error.message)
        } finally {
            setLoading(null)
        }
    }

    if (!accessCode) return <span className="text-muted-foreground text-sm">No code</span>

    return (
        <div className="flex gap-2">
            {email && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => sendCredentials("email")}
                    disabled={!!loading}
                    title={`Send via Email to ${email}`}
                >
                    {loading === "email" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Mail className="w-3 h-3" />}
                </Button>
            )}
            {phoneNumber && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => sendCredentials("phone")}
                    disabled={!!loading}
                    title={`Send via SMS to ${phoneNumber}`}
                >
                    {loading === "phone" ? <Loader2 className="w-3 h-3 animate-spin" /> : <MessageSquare className="w-3 h-3" />}
                </Button>
            )}
        </div>
    )
}
