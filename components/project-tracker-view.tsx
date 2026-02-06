"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, RefreshCw, Calendar, Layers, Activity, Smartphone, Globe, Server, User, Pencil, Trash2, Check, X, Plus, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth-context"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
// import { format } from "date-fns" // Optional if we stick to native formatting for simplicity or match existing styles

interface ProjectTrackerViewProps {
    projectId: string
    onBack: () => void
}

interface Project {
    id: string
    name: string
    description: string
    lead: string
    leadEmail: string
    status: string
    dueDate: string
    startDate: string
}

// Mock data structure based on the user's image
interface TrackerRow {
    id: string
    phase: string
    date: string
    description: string
    platform: "Backend" | "Web" | "Android" | "Management" | "iOS"
    status: "Pending" | "Scheduled" | "Completed" | "In Progress"
}

export default function ProjectTrackerView({ projectId, onBack }: ProjectTrackerViewProps) {
    const { user } = useAuth()

    // Detect if user is a guest (logged in with access code)
    const [isGuest, setIsGuest] = useState(false)

    useEffect(() => {
        // Check if user is guest from localStorage
        const userData = localStorage.getItem("user")
        if (userData) {
            const parsedUser = JSON.parse(userData)
            setIsGuest(parsedUser.id?.startsWith("guest_") || false)
        }
    }, [user])
    const [project, setProject] = useState<Project | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Fetch project details
    const fetchProjectDetails = async () => {
        try {
            setIsLoading(true)
            const token = localStorage.getItem("token")
            const response = await fetch(`/api/projects/${projectId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            const data = await response.json()
            if (data.success) {
                setProject(data.project)
                if (data.project.phases) {
                    setTrackerData(data.project.phases)
                }
            } else {
                setError(data.error || "Failed to fetch project")
            }
        } catch (error) {
            console.error("Error fetching project:", error)
            setError("Failed to load project details")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchProjectDetails()
    }, [projectId])

    // State for tracker data - Start empty as requested
    const [trackerData, setTrackerData] = useState<TrackerRow[]>([])

    // State for editing
    const [editingId, setEditingId] = useState<string | null>(null)

    // State for Settings Modal
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const [memberEmails, setMemberEmails] = useState<string[]>([''])
    const [isPublishing, setIsPublishing] = useState(false)
    const [publishStatus, setPublishStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null)

    // Handlers for Editable Fields
    const handleTextChange = (id: string, field: keyof TrackerRow, value: string) => {
        setTrackerData(prev => prev.map(row =>
            row.id === id ? { ...row, [field]: value } : row
        ))
    }

    const handlePlatformChange = (id: string, value: TrackerRow["platform"]) => {
        setTrackerData(prev => prev.map(row =>
            row.id === id ? { ...row, platform: value } : row
        ))
    }

    const handleStatusChange = (id: string, value: TrackerRow["status"]) => {
        setTrackerData(prev => prev.map(row =>
            row.id === id ? { ...row, status: value } : row
        ))
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this task?")) return;

        try {
            const token = localStorage.getItem("token")
            const response = await fetch(`/api/projects/${projectId}/phases`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ phaseId: id }),
            })

            if (response.ok) {
                setTrackerData(prev => prev.filter(row => row.id !== id))
            } else {
                alert("Failed to delete phase")
            }
        } catch (error) {
            console.error("Error deleting phase:", error)
            alert("Error deleting phase")
        }
    }

    const startEditing = (id: string) => {
        setEditingId(id)
    }

    const saveEditing = async () => {
        if (!editingId) return;
        const rowToSave = trackerData.find(r => r.id === editingId);
        if (!rowToSave) return;

        try {
            const token = localStorage.getItem("token")
            const response = await fetch(`/api/projects/${projectId}/phases`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    phaseId: rowToSave.id,
                    updates: {
                        phase: rowToSave.phase,
                        date: rowToSave.date,
                        description: rowToSave.description,
                        platform: rowToSave.platform,
                        status: rowToSave.status
                    }
                }),
            })

            if (response.ok) {
                setEditingId(null)
            } else {
                alert("Failed to save changes")
            }
        } catch (error) {
            console.error("Error saving phase:", error)
            alert("Error saving phase")
        }
    }

    const addNewRow = async () => {
        try {
            const token = localStorage.getItem("token")
            const newPhaseData = {
                phase: "Phase 1.1",
                date: new Date().toLocaleDateString("en-GB"),
                description: "",
                platform: "Backend",
                status: "Pending"
            }

            const response = await fetch(`/api/projects/${projectId}/phases`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(newPhaseData),
            })

            const data = await response.json();

            if (data.success && data.phase) {
                const newRow: TrackerRow = {
                    id: data.phase._id, // Use actual DB ID
                    phase: data.phase.phase,
                    date: data.phase.date,
                    description: data.phase.description,
                    platform: data.phase.platform,
                    status: data.phase.status
                }
                setTrackerData([...trackerData, newRow])
                setEditingId(data.phase._id) // Automatically start editing new row
            } else {
                alert("Failed to add new phase")
            }
        } catch (error) {
            console.error("Error adding phase:", error)
            alert("Error adding phase")
        }
    }

    // Member Email Management
    const addEmailField = () => {
        setMemberEmails([...memberEmails, ''])
    }

    const removeEmailField = (index: number) => {
        setMemberEmails(memberEmails.filter((_, i) => i !== index))
    }

    const updateEmail = (index: number, value: string) => {
        const updated = [...memberEmails]
        updated[index] = value
        setMemberEmails(updated)
    }

    // Handle Publish
    const handlePublish = async () => {
        // Filter out empty emails
        const validEmails = memberEmails.filter(email => email.trim() !== '')

        if (validEmails.length === 0) {
            setPublishStatus({ type: 'error', message: 'Please add at least one email address' })
            return
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        const invalidEmails = validEmails.filter(email => !emailRegex.test(email))

        if (invalidEmails.length > 0) {
            setPublishStatus({
                type: 'error',
                message: `Invalid email format: ${invalidEmails.join(', ')}`
            })
            return
        }

        setIsPublishing(true)
        setPublishStatus(null)

        try {
            const token = localStorage.getItem('token')
            const response = await fetch(`/api/projects/${projectId}/publish`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ emails: validEmails })
            })

            const data = await response.json()

            if (data.success) {
                setPublishStatus({
                    type: 'success',
                    message: data.message || 'Invitations sent successfully!'
                })
                // Reset email fields after successful publish
                setMemberEmails([''])

                // Close modal after 2 seconds
                setTimeout(() => {
                    setIsSettingsOpen(false)
                    setPublishStatus(null)
                }, 2000)
            } else {
                setPublishStatus({
                    type: 'error',
                    message: data.error || data.message || 'Failed to send invitations'
                })
            }
        } catch (error) {
            console.error('Error publishing:', error)
            setPublishStatus({
                type: 'error',
                message: 'Failed to send invitations. Please try again.'
            })
        } finally {
            setIsPublishing(false)
        }
    }

    const getPlatformBadge = (platform: string) => {
        switch (platform) {
            case "Backend": return "bg-stone-100 text-stone-800 border border-stone-200"
            case "Web": return "bg-orange-100 text-orange-800 border border-orange-200"
            case "Android": return "bg-rose-100 text-rose-800 border border-rose-200"
            case "iOS": return "bg-slate-100 text-slate-800 border border-slate-200"
            case "Management": return "bg-amber-100 text-amber-800 border border-amber-200"
            default: return "bg-gray-100 text-gray-800 border border-gray-200"
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "Completed": return "bg-emerald-50 text-emerald-700 border border-emerald-200"
            case "In Progress": return "bg-blue-50 text-blue-700 border border-blue-200"
            case "Scheduled": return "bg-orange-50 text-orange-700 border border-orange-200"
            case "Pending": return "bg-gray-50 text-gray-600 border border-gray-200"
            default: return "bg-gray-50 text-gray-600"
        }
    }

    if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading tracker...</div>
    if (error) return <div className="p-8 text-center text-destructive">{error}</div>

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-300">
            {/* Header */}
            <div>
                <div className="flex items-center gap-4 mb-4">
                    <Button variant="ghost" size="sm" onClick={onBack} className="hover:bg-primary/5">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div className="flex-1">
                        <h2 className="text-3xl font-brand font-bold text-foreground mb-2">{project?.name}</h2>
                        <p className="text-muted-foreground">{project?.description}</p>
                    </div>
                    {!isGuest && (
                        <div className="flex gap-2">
                            <Button onClick={fetchProjectDetails} variant="outline" size="sm">
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Refresh
                            </Button>
                            <Button onClick={() => setIsSettingsOpen(true)} variant="outline" size="sm">
                                <Settings className="w-4 h-4 mr-2" />
                                Settings
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Tracker Table */}
            <div className="border border-border rounded-xl overflow-hidden shadow-sm bg-white">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted/50 border-b border-border">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-foreground">Phase</th>
                                <th className="px-6 py-4 font-semibold text-foreground">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={14} /> Date
                                    </div>
                                </th>
                                <th className="px-6 py-4 font-semibold text-foreground w-1/3">Task Description</th>
                                <th className="px-6 py-4 font-semibold text-foreground">
                                    <div className="flex items-center gap-2">
                                        <Globe size={14} /> Platform
                                    </div>
                                </th>
                                <th className="px-6 py-4 font-semibold text-foreground">
                                    <div className="flex items-center gap-2">
                                        <Activity size={14} /> Status
                                    </div>
                                </th>
                                {!isGuest && <th className="px-6 py-4 font-semibold text-foreground text-right">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {trackerData.length > 0 ? (
                                trackerData.map((row) => (
                                    <tr key={row.id} className="hover:bg-muted/5 transition-colors">
                                        <td className="px-6 py-4 font-medium text-foreground">
                                            {editingId === row.id ? (
                                                <Input
                                                    value={row.phase}
                                                    onChange={(e) => handleTextChange(row.id, "phase", e.target.value)}
                                                    className="h-8 w-full"
                                                />
                                            ) : (
                                                row.phase
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {editingId === row.id ? (
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant={"outline"}
                                                            className={cn(
                                                                "h-8 w-[140px] pl-3 text-left font-normal",
                                                                !row.date && "text-muted-foreground"
                                                            )}
                                                        >
                                                            {row.date ? row.date : <span>Pick a date</span>}
                                                            <Calendar className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <CalendarComponent
                                                            mode="single"
                                                            selected={(() => {
                                                                if (!row.date) return undefined;
                                                                const parts = row.date.split('/')
                                                                if (parts.length === 3) {
                                                                    // DD/MM/YYYY -> MM/DD/YYYY to parse correctly
                                                                    return new Date(`${parts[1]}/${parts[0]}/${parts[2]}`)
                                                                }
                                                                return undefined
                                                            })()}
                                                            onSelect={(date) => {
                                                                if (date) {
                                                                    // Format back to DD/MM/YYYY
                                                                    const formatted = date.toLocaleDateString("en-GB", {
                                                                        day: '2-digit',
                                                                        month: '2-digit',
                                                                        year: 'numeric'
                                                                    })
                                                                    handleTextChange(row.id, "date", formatted)
                                                                }
                                                            }}
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                            ) : (
                                                row.date
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {editingId === row.id ? (
                                                <Input
                                                    value={row.description}
                                                    onChange={(e) => handleTextChange(row.id, "description", e.target.value)}
                                                    placeholder="Task Description"
                                                    className="h-8 w-full focus:placeholder-transparent"
                                                />
                                            ) : (
                                                row.description
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {editingId === row.id ? (
                                                <Select
                                                    value={row.platform}
                                                    onValueChange={(value) => handlePlatformChange(row.id, value as TrackerRow["platform"])}
                                                >
                                                    <SelectTrigger className={`h-8 w-auto px-3 text-xs font-bold rounded-md border-input bg-background`}>
                                                        <SelectValue>{row.platform}</SelectValue>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Backend">Backend</SelectItem>
                                                        <SelectItem value="Web">Web</SelectItem>
                                                        <SelectItem value="Android">Android</SelectItem>
                                                        <SelectItem value="iOS">iOS</SelectItem>
                                                        <SelectItem value="Management">Management</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getPlatformBadge(row.platform)}`}>
                                                    {row.platform}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {editingId === row.id ? (
                                                <Select
                                                    value={row.status}
                                                    onValueChange={(value) => handleStatusChange(row.id, value as TrackerRow["status"])}
                                                >
                                                    <SelectTrigger className={`h-8 w-auto px-3 text-xs font-bold rounded-md border-input bg-background`}>
                                                        <SelectValue>{row.status}</SelectValue>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Pending">Pending</SelectItem>
                                                        <SelectItem value="In Progress">In Progress</SelectItem>
                                                        <SelectItem value="Scheduled">Scheduled</SelectItem>
                                                        <SelectItem value="Completed">Completed</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getStatusBadge(row.status)}`}>
                                                    {row.status}
                                                </span>
                                            )}
                                        </td>
                                        {!isGuest && (
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {editingId === row.id ? (
                                                        <Button variant="ghost" size="icon" onClick={saveEditing} className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50">
                                                            <Check size={16} />
                                                        </Button>
                                                    ) : (
                                                        <Button variant="ghost" size="icon" onClick={() => startEditing(row.id)} className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-muted">
                                                            <Pencil size={16} />
                                                        </Button>
                                                    )}

                                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(row.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-red-50">
                                                        <Trash2 size={16} />
                                                    </Button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={isGuest ? 5 : 6} className="px-6 py-12 text-center text-muted-foreground">
                                        No tracking data available yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {/* Add Phase Button Area */}
                {!isGuest && (
                    <div className="p-4 flex justify-end border-t border-border bg-muted/20">
                        <Button onClick={addNewRow} className="bg-primary hover:bg-primary/90 text-white shadow-sm">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Phase
                        </Button>
                    </div>
                )}
            </div>

            {/* Settings Modal */}
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Project Settings</DialogTitle>
                        <DialogDescription>
                            Manage draft information and team member access for {project?.name}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        {/* Draft Information Section */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg text-foreground">Draft Information</h3>
                            <div
                                onClick={() => setIsSettingsOpen(false)}
                                className="border rounded-lg p-6 bg-white hover:bg-muted/20 transition-colors cursor-pointer group"
                            >
                                {trackerData.length > 0 ? (
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1">Saved draft</p>
                                            <p className="text-2xl font-bold text-foreground">
                                                {trackerData.length} {trackerData.length === 1 ? 'Phase' : 'Phases'}
                                            </p>
                                        </div>
                                        <div className="text-primary group-hover:translate-x-1 transition-transform">
                                            <ArrowLeft className="w-5 h-5 rotate-180" />
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground text-center py-4">No draft data available</p>
                                )}
                            </div>
                        </div>

                        {/* Team Members Section */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="font-semibold text-lg text-foreground">Team Members</h3>
                                <Button onClick={addEmailField} variant="outline" size="sm">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Member
                                </Button>
                            </div>
                            <div className="space-y-2">
                                {memberEmails.map((email, index) => (
                                    <div key={index} className="flex gap-2">
                                        <Input
                                            type="email"
                                            placeholder="member@example.com"
                                            value={email}
                                            onChange={(e) => updateEmail(index, e.target.value)}
                                            className="flex-1"
                                        />
                                        {memberEmails.length > 1 && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeEmailField(index)}
                                                className="text-destructive hover:text-destructive hover:bg-red-50"
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Status Message */}
                    {publishStatus && (
                        <div className={`mx-6 mb-4 p-4 rounded-lg ${publishStatus.type === 'success'
                            ? 'bg-green-50 border border-green-200 text-green-800'
                            : 'bg-red-50 border border-red-200 text-red-800'
                            }`}>
                            <p className="text-sm font-medium">{publishStatus.message}</p>
                        </div>
                    )}

                    {/* Footer Actions */}
                    <div className="flex justify-end gap-2 pt-4 border-t mx-6 pb-6">
                        <Button
                            variant="outline"
                            onClick={() => setIsSettingsOpen(false)}
                            disabled={isPublishing}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handlePublish}
                            disabled={isPublishing}
                            className="bg-primary hover:bg-primary/90 text-white"
                        >
                            {isPublishing ? 'Sending...' : 'Publish'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
