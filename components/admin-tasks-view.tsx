"use client"

import { ArrowLeft, AlertCircle, Search, RefreshCw, Trash2, UserCog, X, Users, UserCheck, Lock, XCircle, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"

import { useRouter } from "next/navigation"

interface AdminTasksViewProps {
  projectId: string
  onOpenManageTeam?: () => void
}

interface Task {
  id: string
  title: string
  description: string
  assignee: string
  assigneeEmail: string
  assigneeId: string
  priority: "High" | "Medium" | "Low" | "Critical"
  status: "Todo" | "Planning" | "In Progress" | "Done" | "Blocked"
  dueDate: string
  skills: string[]
  subtasks: Array<{ id: string; title: string; completed: boolean }>
}

interface Project {
  id: string
  name: string
  description: string
  lead: string
  leadEmail: string
  leadId: string
  members: Array<{ id: string; name: string; email: string; role: string }>
  status: string
  priority: string
  progress: number
  dueDate: string
  startDate: string
}

export default function AdminTasksView({ projectId, onOpenManageTeam }: AdminTasksViewProps) {
  const { user, refreshUser } = useAuth()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [project, setProject] = useState<Project | null>(null)
  const [allTasks, setAllTasks] = useState<Task[]>([])
  const [members, setMembers] = useState<Array<{ id: string, name: string, role: string }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isChangeLeadModalOpen, setIsChangeLeadModalOpen] = useState(false)
  const [selectedNewLead, setSelectedNewLead] = useState("")
  const [isUpdatingLead, setIsUpdatingLead] = useState(false)
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [selectedNewAssignee, setSelectedNewAssignee] = useState("")
  const [isReassigning, setIsReassigning] = useState(false)
  const [isClosingProject, setIsClosingProject] = useState(false)
  const [isDeletingProject, setIsDeletingProject] = useState(false)

  // Fetch project details and tasks
  const fetchProjectDetails = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      setError(null)
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/projects/${projectId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      })

      const data = await response.json()

      if (data.success) {
        setProject(data.project)
        setAllTasks(data.tasks)
      } else {
        setError(data.error || "Failed to fetch project details")
      }
    } catch (error) {
      console.error("Error fetching project details:", error)
      setError("Failed to fetch project details")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProjectDetails()
    fetchMembers()
  }, [projectId, user])

  const fetchMembers = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/members", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      })
      const data = await response.json()
      if (data.success && data.members) {
        setMembers(data.members)
      }
    } catch (error) {
      console.error("Error fetching members:", error)
    }
  }

  // Function to copy task description
  const handleCopyDescription = async (description: string, taskTitle: string) => {
    try {
      await navigator.clipboard.writeText(description)
      alert(`Copied description for "${taskTitle}"`)
    } catch (error) {
      console.error("Error copying to clipboard:", error)
      alert("Failed to copy description")
    }
  }

  // Function to delete task (Admin only)
  const handleDeleteTask = async (taskId: string, taskTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${taskTitle}"? This action cannot be undone.`)) {
      return
    }

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      })

      const data = await response.json()

      if (data.success) {
        // Remove task from local state
        setAllTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId))
      } else {
        alert(data.error || "Failed to delete task")
      }
    } catch (error) {
      console.error("Error deleting task:", error)
      alert("Failed to delete task")
    }
  }

  // Function to reassign task (Lead or Admin only)
  const handleReassignTask = async () => {
    if (!selectedTask || !selectedNewAssignee) {
      alert("Please select a new assignee")
      return
    }

    try {
      setIsReassigning(true)
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/tasks/${selectedTask.id}/reassign`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({ newAssigneeId: selectedNewAssignee }),
      })

      const data = await response.json()

      if (data.success) {
        // Update local task state with the new assignee info from backend
        setAllTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.id === selectedTask.id
              ? {
                ...task,
                assignee: data.task.assignee.name,
                assigneeEmail: data.task.assignee.email,
                assigneeId: data.task.assignee.id,
              }
              : task,
          ),
        )

        setIsReassignModalOpen(false)
        setSelectedTask(null)
        setSelectedNewAssignee("")

        alert(data.message || "Task reassigned successfully")
      } else {
        alert(data.error || "Failed to reassign task")
      }
    } catch (error) {
      console.error("Error reassigning task:", error)
      alert("Failed to reassign task")
    } finally {
      setIsReassigning(false)
    }
  }

  // Function to update project lead (Admin only)
  const handleUpdateLead = async () => {
    if (!selectedNewLead) {
      alert("Please select a new lead")
      return
    }

    try {
      setIsUpdatingLead(true)
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({ leadId: selectedNewLead }),
      })

      const data = await response.json()

      if (data.success) {
        // Update local project state
        if (project && data.project) {
          setProject({
            ...project,
            lead: data.project.lead,
            leadEmail: data.project.leadEmail,
            leadId: data.project.leadId,
          })
        }

        // Refresh user data to update role if current user was assigned as lead
        await refreshUser()

        setIsChangeLeadModalOpen(false)
        setSelectedNewLead("")

        // Show success message
        alert("Project lead updated successfully")

        // Force a full page reload to ensure UI updates properly
        window.location.reload()
      } else {
        alert(data.error || "Failed to update project lead")
      }
    } catch (error) {
      console.error("Error updating project lead:", error)
      alert("Failed to update project lead")
    } finally {
      setIsUpdatingLead(false)
    }
  }

  // Close project (Lead only - all tasks must be done)
  const handleCloseProject = async () => {
    if (!project || !user) return

    const incompleteTasks = allTasks.filter((t) => t.status !== "Done").length
    if (incompleteTasks > 0) {
      alert(`Cannot close project. ${incompleteTasks} task(s) are still incomplete. Please complete all tasks first.`)
      return
    }

    if (totalTasks === 0) {
      alert("Cannot close project with no tasks. Add tasks first.")
      return
    }

    if (!confirm(`Are you sure you want to close "${project.name}"? This project will be marked as closed and only admins can delete it.`)) {
      return
    }

    try {
      setIsClosingProject(true)
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/projects/${projectId}/close`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      })

      const data = await response.json()

      if (data.success) {
        alert("Project closed successfully!")
        await fetchProjectDetails() // Refresh project data
      } else {
        alert(data.error || "Failed to close project")
      }
    } catch (error) {
      console.error("Error closing project:", error)
      alert("Failed to close project")
    } finally {
      setIsClosingProject(false)
    }
  }

  // Delete project (Admin only - project must be closed first)
  const handleDeleteProject = async () => {
    if (!project || !user) return

    if (project.status !== "Closed") {
      alert(`Project must be closed by the lead before it can be deleted. Current status: ${project.status}`)
      return
    }

    if (!confirm(`Are you sure you want to permanently delete "${project.name}"? This action cannot be undone. All tasks will also be deleted.`)) {
      return
    }

    try {
      setIsDeletingProject(true)
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/projects/${projectId}/delete`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      })

      const data = await response.json()

      if (data.success) {
        alert(`Project deleted successfully! ${data.deletedTasks} task(s) were also deleted.`)
        router.push("/admin") // Navigate back to admin dashboard
      } else {
        alert(data.error || "Failed to delete project")
      }
    } catch (error) {
      console.error("Error deleting project:", error)
      alert("Failed to delete project")
    } finally {
      setIsDeletingProject(false)
    }
  }

  const totalTasks = allTasks.length
  const completedTasks = allTasks.filter((t) => t.status === "Done").length
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  // Filter tasks based on search
  const filteredTasks = allTasks.filter(
    (task) =>
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.assignee.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical":
        return "text-destructive font-semibold"
      case "High":
        return "text-orange-700 dark:text-orange-400 font-medium"
      case "Medium":
        return "text-yellow-700 dark:text-yellow-400"
      case "Low":
        return "text-green-700 dark:text-green-400"
      default:
        return "text-muted-foreground"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "In Progress":
        return "bg-blue-100/40 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 border-blue-200 dark:border-blue-800"
      case "Todo":
        return "bg-gray-100/40 text-gray-700 dark:bg-gray-900/40 dark:text-gray-400 border-gray-200 dark:border-gray-800"
      case "Planning":
        return "bg-purple-100/40 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400 border-purple-200 dark:border-purple-800"
      case "Done":
        return "bg-green-100/40 text-green-700 dark:bg-green-900/40 dark:text-green-400 border-green-200 dark:border-green-800"
      case "Blocked":
        return "bg-red-100/40 text-red-700 dark:bg-red-900/40 dark:text-red-400 border-red-200 dark:border-red-800"
      default:
        return "bg-muted/40 text-muted-foreground border-muted"
    }
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading project details...</p>
      </div>
    )
  }

  // Show error state
  if (error || !project) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <p className="text-destructive mb-2">Error: {error || "Project not found"}</p>
          <Button onClick={fetchProjectDetails} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-foreground mb-2">{project.name}</h2>
            <p className="text-muted-foreground">
              Lead: {project.lead} • {totalTasks} tasks • {completedTasks} completed • {progressPercentage}% progress
            </p>
            {project.description && (
              <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
            )}
          </div>
          <div className="flex gap-2">
            {(user?.role === "Admin" || user?.role === "Lead") && onOpenManageTeam && (
              <Button onClick={onOpenManageTeam} variant="outline" size="sm">
                <Users className="w-4 h-4 mr-2" />
                Manage Team
              </Button>
            )}
            {user?.role === "Admin" && (
              <Button onClick={() => setIsChangeLeadModalOpen(true)} variant="outline" size="sm">
                <UserCog className="w-4 h-4 mr-2" />
                Change Lead
              </Button>
            )}
            {/* Close Project Button - Lead only (when all tasks done) */}
            {(user?.role === "Lead" || user?.role === "Admin") && project.leadId === user?.id && project.status !== "Closed" && completedTasks === totalTasks && totalTasks > 0 && (
              <Button
                onClick={handleCloseProject}
                variant="outline"
                size="sm"
                disabled={isClosingProject}
                className="border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
              >
                <Lock className="w-4 h-4 mr-2" />
                {isClosingProject ? "Closing..." : "Close Project"}
              </Button>
            )}
            {/* Delete Project Button - Admin only (when project is closed) */}
            {user?.role === "Admin" && project.status === "Closed" && (
              <Button
                onClick={handleDeleteProject}
                variant="outline"
                size="sm"
                disabled={isDeletingProject}
                className="border-destructive text-destructive hover:bg-destructive/10"
              >
                <XCircle className="w-4 h-4 mr-2" />
                {isDeletingProject ? "Deleting..." : "Delete Project"}
              </Button>
            )}
            <Button onClick={fetchProjectDetails} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="flex gap-4 items-center">
          <div className="flex-1 relative max-w-md">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks or members..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="border border-border rounded-lg overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Task Title</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Assigned To</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Priority</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Status</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Due Date</th>
                {(user?.role === "Admin" || user?.role === "Lead") && (
                  <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {task.priority === "Critical" && <AlertCircle className="w-4 h-4 text-destructive shrink-0" />}
                        <span className="font-medium text-foreground">{task.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-foreground">{task.assignee}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm ${getPriorityColor(task.priority)}`}>{task.priority}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}
                      >
                        {task.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-muted-foreground">{task.dueDate || "No due date"}</span>
                    </td>
                    {(user?.role === "Admin" || user?.role === "Lead") && (
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-primary hover:text-primary hover:bg-primary/10"
                            onClick={() => handleCopyDescription(task.description, task.title)}
                            title="Copy description"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-950"
                            onClick={() => {
                              setSelectedTask(task)
                              setSelectedNewAssignee("")
                              setIsReassignModalOpen(true)
                            }}
                            title="Reassign task"
                          >
                            <UserCheck className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteTask(task.id, task.title)}
                            title="Delete task"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={(user?.role === "Admin" || user?.role === "Lead") ? 6 : 5} className="px-6 py-12 text-center">
                    <p className="text-muted-foreground">
                      {searchQuery ? "No tasks found matching your search" : "No tasks in this project yet"}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">Total Tasks</p>
          <p className="text-2xl font-bold text-foreground">{totalTasks}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">Completed</p>
          <p className="text-2xl font-bold text-green-600">{completedTasks}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">In Progress</p>
          <p className="text-2xl font-bold text-blue-600">
            {allTasks.filter((t) => t.status === "In Progress").length}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">Progress</p>
          <p className="text-2xl font-bold text-foreground">{progressPercentage}%</p>
        </div>
      </div>

      {/* Reassign Task Modal */}
      {isReassignModalOpen && selectedTask && project && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-lg border-border shadow-lg">
            <CardHeader className="pb-3 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <UserCheck className="w-6 h-6 text-primary" />
                    Reassign Task
                  </CardTitle>
                  <CardDescription className="mt-2">
                    Assign &quot;{selectedTask.title}&quot; to a different team member
                  </CardDescription>
                </div>
                <button
                  onClick={() => {
                    setIsReassignModalOpen(false)
                    setSelectedTask(null)
                    setSelectedNewAssignee("")
                  }}
                  className="rounded-lg hover:bg-muted p-1 transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
            </CardHeader>

            <CardContent className="pt-6">
              <div className="space-y-6">
                {/* Current Assignee */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground block">
                    Current Assignee
                  </label>
                  <div className="flex items-center gap-3 px-4 py-3 bg-muted/50 border border-border rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                      {selectedTask.assignee.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{selectedTask.assignee}</p>
                      <p className="text-xs text-muted-foreground">{selectedTask.assigneeEmail}</p>
                    </div>
                  </div>
                </div>

                {/* New Assignee Selection */}
                <div className="space-y-3">
                  <label htmlFor="newAssignee" className="text-sm font-medium text-foreground block">
                    Select New Assignee <span className="text-destructive">*</span>
                  </label>

                  <div className="space-y-2 max-h-64 overflow-y-auto border border-border rounded-lg p-2">
                    {/* Project Lead */}
                    {project.leadId && project.leadId !== selectedTask.assigneeId && (
                      <button
                        type="button"
                        onClick={() => setSelectedNewAssignee(project.leadId)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${selectedNewAssignee === project.leadId
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted/50 text-foreground"
                          }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${selectedNewAssignee === project.leadId
                          ? "bg-primary-foreground/20"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          }`}>
                          {project.lead.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-medium text-sm">{project.lead}</p>
                          <p className={`text-xs ${selectedNewAssignee === project.leadId
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground"
                            }`}>Lead • {project.leadEmail}</p>
                        </div>
                        {selectedNewAssignee === project.leadId && (
                          <div className="w-5 h-5 rounded-full bg-primary-foreground flex items-center justify-center">
                            <svg className="w-3 h-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </button>
                    )}

                    {/* Project Members */}
                    {project.members
                      .filter((member) => member.id !== selectedTask.assigneeId)
                      .map((member) => {
                        const isCurrentUser = member.id === user?.id
                        const roleColor = member.role === "Admin"
                          ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                          : member.role === "Lead"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                            : "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400"

                        return (
                          <button
                            key={member.id}
                            type="button"
                            onClick={() => setSelectedNewAssignee(member.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${selectedNewAssignee === member.id
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted/50 text-foreground"
                              }`}
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${selectedNewAssignee === member.id
                              ? "bg-primary-foreground/20"
                              : roleColor
                              }`}>
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 text-left">
                              <p className="font-medium text-sm flex items-center gap-2">
                                {member.name}
                                {isCurrentUser && (
                                  <span className={`text-xs px-1.5 py-0.5 rounded ${selectedNewAssignee === member.id
                                    ? "bg-primary-foreground/20 text-primary-foreground"
                                    : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                    }`}>You</span>
                                )}
                              </p>
                              <p className={`text-xs ${selectedNewAssignee === member.id
                                ? "text-primary-foreground/70"
                                : "text-muted-foreground"
                                }`}>{member.role} • {member.email}</p>
                            </div>
                            {selectedNewAssignee === member.id && (
                              <div className="w-5 h-5 rounded-full bg-primary-foreground flex items-center justify-center">
                                <svg className="w-3 h-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            )}
                          </button>
                        )
                      })}

                    {/* Show message if no members available */}
                    {project.members.filter((m) => m.id !== selectedTask.assigneeId).length === 0 &&
                      (!project.leadId || project.leadId === selectedTask.assigneeId) && (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                          No other team members available in this project
                        </div>
                      )}
                  </div>

                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Only members of this project are shown
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsReassignModalOpen(false)
                      setSelectedTask(null)
                      setSelectedNewAssignee("")
                    }}
                    className="flex-1"
                    disabled={isReassigning}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleReassignTask}
                    className="flex-1 bg-primary hover:bg-primary/90"
                    disabled={isReassigning || !selectedNewAssignee}
                  >
                    <UserCheck className="w-4 h-4 mr-2" />
                    {isReassigning ? "Reassigning..." : "Reassign Task"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Change Lead Modal */}
      {isChangeLeadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-md border-border shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">Change Project Lead</CardTitle>
                  <CardDescription className="mt-1">
                    Select a new lead for {project.name}
                  </CardDescription>
                </div>
                <button
                  onClick={() => {
                    setIsChangeLeadModalOpen(false)
                    setSelectedNewLead("")
                  }}
                  className="rounded-lg hover:bg-muted p-1 transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-5">
                <div className="space-y-2">
                  <label htmlFor="currentLead" className="text-sm font-medium text-foreground block">
                    Current Lead
                  </label>
                  <div className="px-3 py-2 text-sm bg-muted border border-border rounded-md">
                    {project.lead} ({project.leadEmail})
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="newLead" className="text-sm font-medium text-foreground block">
                    New Lead <span className="text-destructive">*</span>
                  </label>
                  <select
                    id="newLead"
                    value={selectedNewLead}
                    onChange={(e) => setSelectedNewLead(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-input border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Select a new lead</option>
                    {members
                      .filter((member) => member.id !== project.leadId)
                      .map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name} ({member.role})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsChangeLeadModalOpen(false)
                      setSelectedNewLead("")
                    }}
                    className="flex-1 bg-transparent"
                    disabled={isUpdatingLead}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleUpdateLead}
                    className="flex-1 bg-primary hover:bg-primary/90"
                    disabled={isUpdatingLead || !selectedNewLead}
                  >
                    <UserCog className="w-4 h-4 mr-2" />
                    {isUpdatingLead ? "Updating..." : "Update Lead"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}