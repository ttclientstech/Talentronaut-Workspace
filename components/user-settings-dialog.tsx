"use client"

import { useState } from "react"
import { Settings, LogOut, KeyRound, AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"

export function UserSettingsDialog() {
    const { logout, user } = useAuth()
    const [isOpen, setIsOpen] = useState(false)
    const [newAccessCode, setNewAccessCode] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

    const handleUpdateCode = async () => {
        if (!newAccessCode || newAccessCode.length < 6) {
            setMessage({ type: "error", text: "Code must be at least 6 characters" })
            return
        }

        setIsLoading(true)
        setMessage(null)

        try {
            const res = await fetch("/api/auth/change-code", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ newAccessCode: newAccessCode.toUpperCase() }),
            })

            const data = await res.json()

            if (data.success) {
                setMessage({ type: "success", text: "Access code updated successfully!" })
                setNewAccessCode("")
            } else {
                setMessage({ type: "error", text: data.error || "Failed to update code" })
            }
        } catch (error) {
            setMessage({ type: "error", text: "Something went wrong" })
        } finally {
            setIsLoading(false)
        }
    }

    const handleLogout = async () => {
        await logout()
        setIsOpen(false)
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-white/70 hover:text-white hover:bg-white/10 rounded-full h-8 w-8"
                >
                    <Settings className="w-4 h-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>User Settings</DialogTitle>
                    <DialogDescription>Manage your account settings</DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Change Access Code Section */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-medium flex items-center gap-2">
                            <KeyRound className="w-4 h-4 text-primary" />
                            Change Access Code
                        </h4>
                        <div className="flex gap-2">
                            <Input
                                placeholder="New Access Code"
                                value={newAccessCode}
                                onChange={(e) => setNewAccessCode(e.target.value.toUpperCase())}
                                className="uppercase font-mono tracking-wider"
                            />
                            <Button onClick={handleUpdateCode} disabled={isLoading} size="sm">
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                            </Button>
                        </div>
                        {message && (
                            <div className={`text-xs flex items-center gap-1.5 ${message.type === "success" ? "text-green-600" : "text-red-500"}`}>
                                {message.type === "success" ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                                {message.text}
                            </div>
                        )}
                    </div>

                    <div className="border-t pt-4">
                        <Button
                            variant="destructive"
                            className="w-full"
                            onClick={handleLogout}
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Logout
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
