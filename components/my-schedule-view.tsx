"use client"

import { useState, useEffect } from "react"
import { Calendar, Clock, Loader2, Edit, Trash2, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth-context"

interface TimeBlock {
  id: string
  title: string
  day: string
  startTime: string
  endTime: string
  type: "working" | "blocked"
}

export default function MyScheduleView() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [workingHours, setWorkingHours] = useState({
    monday: { start: "09:00", end: "17:00", enabled: true },
    tuesday: { start: "09:00", end: "17:00", enabled: true },
    wednesday: { start: "09:00", end: "17:00", enabled: true },
    thursday: { start: "09:00", end: "17:00", enabled: true },
    friday: { start: "09:00", end: "17:00", enabled: true },
    saturday: { start: "09:00", end: "17:00", enabled: false },
    sunday: { start: "09:00", end: "17:00", enabled: false },
  })

  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([])
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null)
  const [editingBlock, setEditingBlock] = useState<TimeBlock | null>(null)

  const days = [
    { key: "monday", label: "Monday" },
    { key: "tuesday", label: "Tuesday" },
    { key: "wednesday", label: "Wednesday" },
    { key: "thursday", label: "Thursday" },
    { key: "friday", label: "Friday" },
    { key: "saturday", label: "Saturday" },
    { key: "sunday", label: "Sunday" },
  ]

  // Fetch schedule from backend
  const fetchSchedule = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      const token = localStorage.getItem("token")
      const response = await fetch("/api/schedule", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      })

      const data = await response.json()

      if (data.success && data.schedule) {
        setWorkingHours(data.schedule.workingHours)
        setTimeBlocks(data.schedule.timeBlocks || [])
      }
    } catch (error) {
      console.error("Error fetching schedule:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch schedule on mount
  useEffect(() => {
    fetchSchedule()
  }, [user])

  const handleWorkingHoursChange = async (day: string, field: string, value: string | boolean) => {
    const updatedHours = {
      ...workingHours,
      [day]: {
        ...workingHours[day as keyof typeof workingHours],
        [field]: value,
      },
    }
    setWorkingHours(updatedHours)

    // Auto-save
    await saveSchedule(updatedHours, timeBlocks)
  }

  // Auto-save function
  const saveSchedule = async (hours: typeof workingHours, blocks: TimeBlock[]) => {
    try {
      setIsSaving(true)
      const token = localStorage.getItem("token")
      const response = await fetch("/api/schedule", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({ workingHours: hours, timeBlocks: blocks }),
      })

      const data = await response.json()

      if (!data.success) {
        console.error("Failed to save schedule:", data.error)
      }
    } catch (error) {
      console.error("Error saving schedule:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditBlock = (block: TimeBlock) => {
    setEditingBlockId(block.id)
    setEditingBlock({ ...block })
  }

  const handleSaveBlock = async () => {
    if (editingBlock) {
      const updatedBlocks = timeBlocks.map((b) => (b.id === editingBlock.id ? editingBlock : b))
      setTimeBlocks(updatedBlocks)
      setEditingBlockId(null)
      setEditingBlock(null)

      // Auto-save
      await saveSchedule(workingHours, updatedBlocks)
    }
  }

  const handleCancelEdit = () => {
    setEditingBlockId(null)
    setEditingBlock(null)
  }

  const handleDeleteBlock = async (blockId: string) => {
    if (confirm("Are you sure you want to delete this blocked time?")) {
      const updatedBlocks = timeBlocks.filter((b) => b.id !== blockId)
      setTimeBlocks(updatedBlocks)

      // Auto-save
      await saveSchedule(workingHours, updatedBlocks)
    }
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <p>Loading schedule...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
          <Calendar className="w-8 h-8" />
          My Schedule
        </h2>
        <p className="text-muted-foreground">
          Set your working hours and block off time. The AI uses this to assign tasks accurately.
        </p>
      </div>

      <div className="space-y-6">
        {/* Working Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Working Hours
            </CardTitle>
            <CardDescription>Set your regular working hours for each day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {days.map((day) => (
                <div key={day.key} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="w-24">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={workingHours[day.key as keyof typeof workingHours].enabled}
                        onChange={(e) => handleWorkingHoursChange(day.key, "enabled", e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm font-medium text-foreground">{day.label}</span>
                    </label>
                  </div>
                  {workingHours[day.key as keyof typeof workingHours].enabled && (
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">From</span>
                        <Input
                          type="time"
                          value={workingHours[day.key as keyof typeof workingHours].start}
                          onChange={(e) => handleWorkingHoursChange(day.key, "start", e.target.value)}
                          className="w-32"
                        />
                      </div>
                      <span className="text-sm text-muted-foreground">to</span>
                      <div className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={workingHours[day.key as keyof typeof workingHours].end}
                          onChange={(e) => handleWorkingHoursChange(day.key, "end", e.target.value)}
                          className="w-32"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Time Blocks */}
        <Card>
          <CardHeader>
            <CardTitle>Blocked Time</CardTitle>
            <CardDescription>Block off specific times when you're unavailable</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {timeBlocks.length > 0 ? (
                timeBlocks.map((block) => (
                  <div key={block.id} className="p-4 border rounded-lg">
                    {editingBlockId === block.id && editingBlock ? (
                      // Edit mode
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium mb-1 block">Title</label>
                          <Input
                            value={editingBlock.title}
                            onChange={(e) => setEditingBlock({ ...editingBlock, title: e.target.value })}
                            placeholder="e.g., Lunch Break, Meeting"
                            className="w-full"
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="text-sm font-medium mb-1 block">Day</label>
                            <select
                              value={editingBlock.day}
                              onChange={(e) => setEditingBlock({ ...editingBlock, day: e.target.value })}
                              className="w-full border rounded-md p-2 bg-background"
                            >
                              {days.map((day) => (
                                <option key={day.key} value={day.key}>
                                  {day.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-1 block">Start Time</label>
                            <Input
                              type="time"
                              value={editingBlock.startTime}
                              onChange={(e) => setEditingBlock({ ...editingBlock, startTime: e.target.value })}
                              className="w-full"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-1 block">End Time</label>
                            <Input
                              type="time"
                              value={editingBlock.endTime}
                              onChange={(e) => setEditingBlock({ ...editingBlock, endTime: e.target.value })}
                              className="w-full"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                            <X className="w-4 h-4 mr-1" />
                            Cancel
                          </Button>
                          <Button size="sm" onClick={handleSaveBlock}>
                            <Check className="w-4 h-4 mr-1" />
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // View mode
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{block.title}</p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {block.day} • {block.startTime} - {block.endTime}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEditBlock(block)}>
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteBlock(block.id)}>
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No blocked time slots. Click "Add Blocked Time" to add one.
                </p>
              )}
              <Button
                variant="outline"
                className="w-full"
                onClick={async () => {
                  const newBlock: TimeBlock = {
                    id: Date.now().toString(),
                    title: "New Blocked Time",
                    day: "monday",
                    startTime: "10:00",
                    endTime: "11:00",
                    type: "blocked",
                  }
                  const updatedBlocks = [...timeBlocks, newBlock]
                  setTimeBlocks(updatedBlocks)

                  // Auto-save
                  await saveSchedule(workingHours, updatedBlocks)
                }}
              >
                Add Blocked Time
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Auto-save indicator */}
        {isSaving && (
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Saving changes...</span>
          </div>
        )}
      </div>
    </div>
  )
}


