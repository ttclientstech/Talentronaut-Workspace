"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus } from "lucide-react"

interface UserDialogProps {
    onUserCreated: () => void
}

export function UserDialog({ onUserCreated }: UserDialogProps) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    // Form State
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [phoneNumber, setPhoneNumber] = useState("")
    const [domain, setDomain] = useState("")
    const [joinDate, setJoinDate] = useState(new Date().toISOString().split('T')[0])
    const [accessCode, setAccessCode] = useState("")
    const [autoGenerate, setAutoGenerate] = useState(true)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const response = await fetch("/api/admin/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    email,
                    phoneNumber,
                    domain,
                    joinDate,
                    accessCode: autoGenerate ? undefined : accessCode,
                    autoGenerateCode: autoGenerate
                })
            })

            const data = await response.json()
            if (!response.ok) throw new Error(data.error)

            setOpen(false)
            onUserCreated()

            // Reset form
            setName("")
            setEmail("")
            setPhoneNumber("")
            setDomain("")
            setAccessCode("")
            setAutoGenerate(true)

        } catch (error: any) {
            alert(error.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button><Plus className="w-4 h-4 mr-2" /> Add User</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New User</DialogTitle>
                    <DialogDescription>
                        Create a new user. Access code will be generated automatically.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Name</Label>
                        <Input id="name" value={name} onChange={e => setName(e.target.value)} className="col-span-3" required />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">Email</Label>
                        <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="col-span-3" required />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="phone" className="text-right">Phone</Label>
                        <Input id="phone" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="domain" className="text-right">Domain</Label>
                        <Input id="domain" value={domain} onChange={e => setDomain(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="joinDate" className="text-right">Join Date</Label>
                        <Input id="joinDate" type="date" value={joinDate} onChange={e => setJoinDate(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Access Code</Label>
                        <div className="col-span-3 flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="auto"
                                checked={autoGenerate}
                                onChange={e => setAutoGenerate(e.target.checked)}
                                className="w-4 h-4"
                            />
                            <Label htmlFor="auto">Auto-generate</Label>
                        </div>
                    </div>
                    {!autoGenerate && (
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="code" className="text-right">Custom Code</Label>
                            <Input id="code" value={accessCode} onChange={e => setAccessCode(e.target.value)} className="col-span-3" />
                        </div>
                    )}
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>{isLoading ? "Saving..." : "Save User"}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
