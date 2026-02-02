"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"

interface CreateTaskModalProps {
  isOpen: boolean
  onClose: () => void
  defaultProjectId?: string
}

interface Project {
  id: string
  name: string
}

interface Member {
  id: string
  name: string
  role: string
}

export default function CreateTaskModal({ isOpen, onClose, defaultProjectId }: CreateTaskModalProps) {
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [isLoadingProjects, setIsLoadingProjects] = useState(false)
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    projectId: defaultProjectId || "",
    assignedToId: "",
    priority: "Medium",
    dueDate: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch members to populate the assignee dropdown
  const fetchMembers = async () => {
    try {
      setIsLoadingMembers(true)
      const token = localStorage.getItem("token")
      const response = await fetch("/api/members", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      })

      const data = await response.json()

      if (data.success && data.members) {
        setMembers(data.members.map((m: any) => ({
          id: m.id,
          name: m.name,
          role: m.role
        })))
      }
    } catch (error) {
      console.error("Error fetching members:", error)
    } finally {
      setIsLoadingMembers(false)
    }
  }

  // Fetch projects when modal opens
  useEffect(() => {
    if (isOpen && user) {
      if (!defaultProjectId) {
        fetchProjects()
      }
      // If defaultProjectId is provided, we don't necessarily need to fetch all projects if we just want to show the current one
      // But fetching them ensures we have the name if needed.
      // For simplicity, let's fetch them so everything works generally, or we could fetch specific project name.
      fetchProjects()

      setFormData(prev => ({
        ...prev,
        projectId: defaultProjectId || prev.projectId
      }))

      fetchMembers()
    }
  }, [isOpen, user, defaultProjectId])

  const fetchProjects = async () => {
    try {
      setIsLoadingProjects(true)
      const token = localStorage.getItem("token")

      // For Leads, fetch only projects they're leading
      // For Admins, fetch all projects
      const endpoint = user?.role === "Lead" ? "/api/projects/lead" : "/api/projects"

      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      })

      const data = await response.json()

      if (data.success && data.projects) {
        setProjects(data.projects.map((p: any) => ({ id: p.id, name: p.name })))
      }
    } catch (error) {
      console.error("Error fetching projects:", error)
    } finally {
      setIsLoadingProjects(false)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = "Task title is required"
    }
    if (!formData.projectId) {
      newErrors.projectId = "Project is required"
    }
    // Only require assignedToId if projectId is not "myself"
    if (formData.projectId !== "myself" && !formData.assignedToId) {
      newErrors.assignedToId = "Assignee is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (validateForm()) {
      try {
        setIsSubmitting(true)
        const token = localStorage.getItem("token")

        const taskData = {
          title: formData.title,
          description: formData.description,
          projectId: formData.projectId,
          // If projectId is "myself", assign to current user
          assignedToId: formData.projectId === "myself" ? user?.id : formData.assignedToId,
          priority: formData.priority,
          dueDate: formData.dueDate || undefined,
        }

        const response = await fetch("/api/tasks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
          body: JSON.stringify(taskData),
        })

        const data = await response.json()

        if (data.success) {
          // Reset form
          setFormData({
            title: "",
            description: "",
            projectId: "",
            assignedToId: "",
            priority: "Medium",
            dueDate: "",
          })
          setErrors({})
          onClose() // This will trigger fetchTasks in parent component
        } else {
          setErrors({ general: data.error || "Failed to create task" })
        }
      } catch (error) {
        console.error("Error creating task:", error)
        setErrors({ general: "Failed to create task. Please try again." })
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target

    // If projectId changes to "myself", clear assignedToId
    if (name === "projectId" && value === "myself") {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        assignedToId: "", // Clear assignedToId when "Myself" is selected
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }))
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md border-border shadow-lg max-h-[90vh] overflow-y-auto">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Create New Task</CardTitle>
              <CardDescription className="mt-1">Add a new task to your project</CardDescription>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg hover:bg-muted p-1 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Task Title */}
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium text-foreground block">
                Task Title <span className="text-destructive">*</span>
              </label>
              <Input
                id="title"
                name="title"
                placeholder="Enter task title"
                value={formData.title}
                onChange={handleInputChange}
                className={errors.title ? "border-destructive" : ""}
                aria-invalid={!!errors.title}
              />
              {errors.title && <p className="text-xs text-destructive mt-1">{errors.title}</p>}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium text-foreground block">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                placeholder="Describe the task..."
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 text-sm bg-input border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring transition-all resize-none"
              />
            </div>

            {/* Project Dropdown */}
            <div className="space-y-2">
              <label htmlFor="projectId" className="text-sm font-medium text-foreground block">
                Project <span className="text-destructive">*</span>
              </label>
              <select
                id="projectId"
                name="projectId"
                value={formData.projectId}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 text-sm bg-input border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring transition-all appearance-none cursor-pointer ${errors.projectId ? "border-destructive" : ""
                  }`}
                aria-invalid={!!errors.projectId}
                disabled={isLoadingProjects || !!defaultProjectId}
              >
                <option value="">Select a project</option>
                <option value="myself">Myself (Personal Task)</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              {errors.projectId && <p className="text-xs text-destructive mt-1">{errors.projectId}</p>}
            </div>

            {/* Assignee Dropdown - Only show if not "Myself" */}
            {formData.projectId !== "myself" && (
              <div className="space-y-2">
                <label htmlFor="assignedToId" className="text-sm font-medium text-foreground block">
                  Assign To <span className="text-destructive">*</span>
                </label>
                <select
                  id="assignedToId"
                  name="assignedToId"
                  value={formData.assignedToId}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 text-sm bg-input border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring transition-all appearance-none cursor-pointer ${errors.assignedToId ? "border-destructive" : ""
                    }`}
                  aria-invalid={!!errors.assignedToId}
                  disabled={isLoadingMembers}
                >
                  <option value="">{isLoadingMembers ? "Loading members..." : "Select an assignee"}</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} ({member.role})
                    </option>
                  ))}
                </select>
                {errors.assignedToId && <p className="text-xs text-destructive mt-1">{errors.assignedToId}</p>}
              </div>
            )}

            {/* Priority Selection */}
            <div className="space-y-2">
              <label htmlFor="priority" className="text-sm font-medium text-foreground block">
                Priority Level
              </label>
              <div className="grid grid-cols-4 gap-2">
                {["Low", "Medium", "High", "Critical"].map((priority) => (
                  <button
                    key={priority}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        priority,
                      }))
                    }
                    className={`px-3 py-2 rounded-md text-xs font-medium transition-all border ${formData.priority === priority
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-input border-border text-foreground hover:border-primary/50"
                      }`}
                  >
                    {priority}
                  </button>
                ))}
              </div>
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <label htmlFor="dueDate" className="text-sm font-medium text-foreground block">
                Due Date
              </label>
              <Input
                id="dueDate"
                name="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={handleInputChange}
              />
            </div>

            {/* General Error */}
            {errors.general && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-xs text-destructive">{errors.general}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 bg-transparent"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90" disabled={isSubmitting}>
                <Plus className="w-4 h-4 mr-2" />
                {isSubmitting ? "Creating..." : "Create Task"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}