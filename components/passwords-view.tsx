"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, Eye, EyeOff, Lock, Copy, Check, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { Checkbox } from "@/components/ui/checkbox"

interface PasswordEntry {
    _id: string
    name: string
    value: string
    accessList: any[]
    createdAt: string
}

interface Member {
    id: string
    name: string
    email: string
}

export default function PasswordsView() {
    const { user } = useAuth()
    const [passwords, setPasswords] = useState<PasswordEntry[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isCopying, setIsCopying] = useState<string | null>(null)

    // Admin only states
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [isManageAccessOpen, setIsManageAccessOpen] = useState(false)
    const [selectedPassword, setSelectedPassword] = useState<PasswordEntry | null>(null)
    const [members, setMembers] = useState<Member[]>([])

    // Form states
    const [newName, setNewName] = useState("")
    const [newValue, setNewValue] = useState("")
    const [selectedMembers, setSelectedMembers] = useState<string[]>([])

    // Reveal state map
    const [revealed, setRevealed] = useState<Record<string, boolean>>({})

    useEffect(() => {
        fetchPasswords()
        if (user?.role === "Admin") {
            fetchMembers()
        }
    }, [user?.role])

    const fetchPasswords = async () => {
        setIsLoading(true)
        try {
            const res = await fetch("/api/passwords")
            const data = await res.json()
            if (data.success) {
                setPasswords(data.passwords)
            }
        } catch (error) {
            console.error("Failed to fetch passwords", error)
        } finally {
            setIsLoading(false)
        }
    }

    const fetchMembers = async () => {
        try {
            const res = await fetch("/api/members")
            const data = await res.json()
            if (data.success) {
                setMembers(data.members)
            }
        } catch (error) {
            console.error("Failed to fetch members", error)
        }
    }

    const handleCreate = async () => {
        if (!newName || !newValue) return

        try {
            const res = await fetch("/api/passwords", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newName,
                    value: newValue,
                    accessList: selectedMembers
                })
            })
            const data = await res.json()
            if (data.success) {
                setPasswords([data.password, ...passwords])
                setIsAddOpen(false)
                setNewName("")
                setNewValue("")
                setSelectedMembers([])
            } else {
                alert(data.error)
            }
        } catch (error) {
            console.error("Create error", error)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this password?")) return
        try {
            const res = await fetch(`/api/passwords/${id}`, { method: "DELETE" })
            if (res.ok) {
                setPasswords(passwords.filter(p => p._id !== id))
            }
        } catch (error) {
            console.error("Delete error", error)
        }
    }

    const handleUpdateAccess = async () => {
        if (!selectedPassword) return
        try {
            const res = await fetch(`/api/passwords/${selectedPassword._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    accessList: selectedMembers
                })
            })
            const data = await res.json()
            if (data.success) {
                // Update local state is tricky because accessList might populate differently
                // So just refetch
                fetchPasswords()
                setIsManageAccessOpen(false)
            }
        } catch (error) {
            console.error("Update access error", error)
        }
    }

    const checkMember = (memberId: string) => {
        if (selectedMembers.includes(memberId)) {
            setSelectedMembers(selectedMembers.filter(id => id !== memberId))
        } else {
            setSelectedMembers([...selectedMembers, memberId])
        }
    }

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text)
        setIsCopying(id)
        setTimeout(() => setIsCopying(null), 2000)
    }

    const openManageAccess = (password: PasswordEntry) => {
        setSelectedPassword(password)
        // Extract IDs from populated accessList
        const currentIds = password.accessList.map((m: any) => typeof m === 'object' ? m._id : m)
        setSelectedMembers(currentIds)
        setIsManageAccessOpen(true)
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-brand font-bold text-foreground">Password Management</h2>
                    <p className="text-muted-foreground mt-1">Securely manage and share team credentials</p>
                </div>

                {user?.role === "Admin" && (
                    <Button onClick={() => { setIsAddOpen(true); setSelectedMembers([]); }} className="bg-primary hover:bg-primary/90 text-white rounded-full px-6">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Password
                    </Button>
                )}
            </div>

            {isLoading ? (
                <div className="text-center py-20 text-muted-foreground">Loading credentials...</div>
            ) : passwords.length === 0 ? (
                <div className="text-center py-20 bg-muted/30 rounded-3xl border border-dashed border-border">
                    <Lock className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                    <h3 className="text-lg font-medium text-foreground">No passwords found</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2">
                        {user?.role === "Admin" ? "Create your first shared password to get started." : "You haven't been granted access to any passwords yet."}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {passwords.map((pwd) => (
                        <Card key={pwd._id} className="group hover:shadow-lg transition-all duration-300 border-border/60 hover:border-primary/20">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <CardTitle className="font-brand text-xl">{pwd.name}</CardTitle>
                                    {user?.role === "Admin" && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(pwd._id)}
                                            className="text-muted-foreground hover:text-destructive -mt-1 -mr-2"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="bg-muted/50 p-3 rounded-xl flex items-center justify-between group-hover:bg-muted/80 transition-colors mb-4">
                                    <code className="font-mono text-sm">
                                        {revealed[pwd._id] ? pwd.value : "••••••••••••"}
                                    </code>
                                    <div className="flex gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                                            onClick={() => setRevealed({ ...revealed, [pwd._id]: !revealed[pwd._id] })}
                                        >
                                            {revealed[pwd._id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                                            onClick={() => copyToClipboard(pwd.value, pwd._id)}
                                        >
                                            {isCopying === pwd._id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                        </Button>
                                    </div>
                                </div>

                                {user?.role === "Admin" && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full justify-between group-hover:border-primary/50 text-muted-foreground group-hover:text-primary transition-all"
                                        onClick={() => openManageAccess(pwd)}
                                    >
                                        <span className="flex items-center gap-2">
                                            <Users className="w-3.5 h-3.5" />
                                            Manage Access
                                        </span>
                                        <span className="bg-muted px-2 py-0.5 rounded-full text-[10px] font-bold">
                                            {pwd.accessList?.length || 0}
                                        </span>
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Add Password Modal */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Password</DialogTitle>
                        <DialogDescription>Store a new secure credential locally.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Details</Label>
                            <Input placeholder="Service Name (e.g. AWS Root)" value={newName} onChange={e => setNewName(e.target.value)} />
                            <Input placeholder="Password Value" type="text" value={newValue} onChange={e => setNewValue(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Assign Access</Label>
                            <div className="border rounded-md max-h-[200px] overflow-y-auto p-2 space-y-2">
                                {members.map(m => (
                                    <div key={m.id} className="flex items-center space-x-2 p-1 hover:bg-muted/50 rounded cursor-pointer" onClick={() => checkMember(m.id)}>
                                        <Checkbox checked={selectedMembers.includes(m.id)} onCheckedChange={() => checkMember(m.id)} />
                                        <span className="text-sm">{m.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreate}>Save Password</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Manage Access Modal */}
            <Dialog open={isManageAccessOpen} onOpenChange={setIsManageAccessOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Manage Access</DialogTitle>
                        <DialogDescription>Select members who can view "{selectedPassword?.name}"</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="border rounded-md max-h-[300px] overflow-y-auto p-2 space-y-2">
                            {members.map(m => (
                                <div key={m.id} className="flex items-center space-x-2 p-1 hover:bg-muted/50 rounded cursor-pointer" onClick={() => checkMember(m.id)}>
                                    <Checkbox checked={selectedMembers.includes(m.id)} onCheckedChange={() => checkMember(m.id)} />
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium">{m.name}</span>
                                        <span className="text-xs text-muted-foreground">{m.email}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsManageAccessOpen(false)}>Cancel</Button>
                        <Button onClick={handleUpdateAccess}>Update Access</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
