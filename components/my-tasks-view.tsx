"use client"

import { useState, useMemo, useEffect } from "react"
import { Plus, Filter, Search, CheckCircle2, Circle, AlertCircle, ChevronDown, RefreshCw, Trash2, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useAuth } from "@/lib/auth-context"
import CreateTaskModal from "./create-task-modal"
import { toast } from "sonner"

interface Task {
  id: string
  title: string
  description: string
  assignee: string
  priority: "High" | "Medium" | "Low" | "Critical"
  status: "Todo" | "Planning" | "In Progress" | "Done"
  dueDate: string
  skills: string[]
  project: string
  subtasks: Array<{ id: string; title: string; completed: boolean }>
}

export default function MyTasksView() {
  const { user } = useAuth()
  const [expandedTask, setExpandedTask] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<string | null>(null)
  const [filterPriority, setFilterPriority] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<"dueDate" | "priority" | "status">("dueDate")
  const [allTasks, setAllTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; taskId: string; taskTitle: string }>({
    isOpen: false,
    taskId: "",
    taskTitle: "",
  })

  // Fetch tasks from API
  const fetchTasks = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      setError(null)
      const token = localStorage.getItem("token")
      const response = await fetch("/api/tasks/my-tasks", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      })

      const data = await response.json()

      if (data.success && data.tasks) {
        setAllTasks(data.tasks)
      } else {
        setError(data.error || "Failed to fetch tasks")
      }
    } catch (error) {
      setError("Failed to fetch tasks")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [user])

  // Function to copy task description
  const handleCopyDescription = async (description: string, taskTitle: string) => {
    try {
      await navigator.clipboard.writeText(description)
      toast.success(`Copied description for "${taskTitle}"`)
    } catch (error) {
      toast.error("Failed to copy description")
    }
  }

  // Function to update task status
  const handleStatusChange = async (taskId: string, newStatus: "Todo" | "Planning" | "In Progress" | "Done") => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/tasks/${taskId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      })

      const data = await response.json()

      if (data.success) {
        // Update local state
        setAllTasks((prevTasks) =>
          prevTasks.map((task) => (task.id === taskId ? { ...task, status: newStatus } : task)),
        )
        toast.success("Task status updated")
      } else {
        toast.error(data.error || "Failed to update task status")
      }
    } catch (error) {
      toast.error("Failed to update task status")
    }
  }

  // Function to delete task (Admin only)
  const handleDeleteTask = async () => {
    const { taskId, taskTitle } = deleteConfirmation

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
        toast.success(`Deleted task "${taskTitle}"`)
        setDeleteConfirmation({ isOpen: false, taskId: "", taskTitle: "" })
      } else {
        toast.error(data.error || "Failed to delete task")
      }
    } catch (error) {
      toast.error("Failed to delete task")
    }
  }

  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    let result = allTasks

    // Search filter
    if (searchQuery) {
      result = result.filter(
        (task) =>
          task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.description.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Status filter
    if (filterStatus) {
      result = result.filter((task) => task.status === filterStatus)
    }

    // Priority filter
    if (filterPriority) {
      result = result.filter((task) => task.priority === filterPriority)
    }

    // Sort
    const sortedResult = [...result]
    switch (sortBy) {
      case "dueDate":
        sortedResult.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        break
      case "priority":
        const priorityOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 }
        sortedResult.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
        break
      case "status":
        const statusOrder = { "In Progress": 0, Planning: 1, Todo: 2, Done: 3 }
        sortedResult.sort((a, b) => statusOrder[a.status] - statusOrder[b.status])
        break
    }

    return sortedResult
  }, [allTasks, searchQuery, filterStatus, filterPriority, sortBy])

  const getPriorityIcon = (priority: string) => {
    if (priority === "Critical") return <AlertCircle className="w-4 h-4 text-destructive" />
    return null
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical":
        return "bg-destructive/20 text-destructive"
      case "High":
        return "bg-orange-100/20 text-orange-700 dark:text-orange-400"
      case "Medium":
        return "bg-yellow-100/20 text-yellow-700 dark:text-yellow-400"
      case "Low":
        return "bg-green-100/20 text-green-700 dark:text-green-400"
      default:
        return "bg-muted/20 text-muted-foreground"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "In Progress":
        return "bg-blue-100/20 text-blue-700 dark:text-blue-400 border-blue-200/30 dark:border-blue-900"
      case "Todo":
        return "bg-gray-100/20 text-gray-700 dark:text-gray-400 border-gray-200/30 dark:border-gray-900"
      case "Planning":
        return "bg-purple-100/20 text-purple-700 dark:text-purple-400 border-purple-200/30 dark:border-purple-900"
      case "Done":
        return "bg-green-100/20 text-green-700 dark:text-green-400 border-green-200/30 dark:border-green-900"
      default:
        return "bg-muted/20 text-muted-foreground border-muted/30"
    }
  }

  const taskStats = {
    total: allTasks.length,
    completed: allTasks.filter((t) => t.status === "Done").length,
    inProgress: allTasks.filter((t) => t.status === "In Progress").length,
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading tasks...</p>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <p className="text-destructive mb-2">Error: {error}</p>
          <Button onClick={fetchTasks} variant="outline">
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
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">My Tasks</h2>
            <p className="text-muted-foreground">
              {taskStats.total} tasks • {taskStats.completed} completed • {taskStats.inProgress} in progress
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchTasks} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={() => setIsCreateTaskOpen(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Task
            </Button>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 space-y-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          {/* Sort Dropdown */}
          <div className="relative group">
            <Button variant="outline" className="gap-2 bg-transparent">
              Sort by: {sortBy === "dueDate" ? "Due Date" : sortBy === "priority" ? "Priority" : "Status"}
              <ChevronDown className="w-4 h-4" />
            </Button>
            <div className="absolute hidden group-hover:flex flex-col bg-popover border border-border rounded-lg shadow-lg mt-1 z-10">
              <button
                onClick={() => setSortBy("dueDate")}
                className="px-4 py-2 text-left hover:bg-muted/50 text-sm border-b border-border last:border-0"
              >
                Due Date
              </button>
              <button
                onClick={() => setSortBy("priority")}
                className="px-4 py-2 text-left hover:bg-muted/50 text-sm border-b border-border last:border-0"
              >
                Priority
              </button>
              <button
                onClick={() => setSortBy("status")}
                className="px-4 py-2 text-left hover:bg-muted/50 text-sm border-b border-border last:border-0"
              >
                Status
              </button>
            </div>
          </div>

          {/* Status Filter */}
          <div className="relative group">
            <Button variant={filterStatus ? "default" : "outline"} className="gap-2">
              <Filter className="w-4 h-4" />
              Status {filterStatus && `(${filterStatus})`}
              <ChevronDown className="w-4 h-4" />
            </Button>
            <div className="absolute hidden group-hover:flex flex-col bg-popover border border-border rounded-lg shadow-lg mt-1 z-10">
              <button
                onClick={() => setFilterStatus(null)}
                className="px-4 py-2 text-left hover:bg-muted/50 text-sm border-b border-border"
              >
                All Status
              </button>
              {["Todo", "Planning", "In Progress", "Done"].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className="px-4 py-2 text-left hover:bg-muted/50 text-sm border-b border-border last:border-0"
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Priority Filter */}
          <div className="relative group">
            <Button variant={filterPriority ? "default" : "outline"} className="gap-2">
              Priority {filterPriority && `(${filterPriority})`}
              <ChevronDown className="w-4 h-4" />
            </Button>
            <div className="absolute hidden group-hover:flex flex-col bg-popover border border-border rounded-lg shadow-lg mt-1 z-10">
              <button
                onClick={() => setFilterPriority(null)}
                className="px-4 py-2 text-left hover:bg-muted/50 text-sm border-b border-border"
              >
                All Priorities
              </button>
              {["Critical", "High", "Medium", "Low"].map((priority) => (
                <button
                  key={priority}
                  onClick={() => setFilterPriority(priority)}
                  className="px-4 py-2 text-left hover:bg-muted/50 text-sm border-b border-border last:border-0"
                >
                  {priority}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => (
            <Card
              key={task.id}
              className="cursor-pointer hover:shadow-md transition-shadow hover:border-primary/50"
              onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
            >
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-foreground">{task.title}</h3>
                        {getPriorityIcon(task.priority)}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">{task.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Change Status Dropdown */}
                      <div className="relative group">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 gap-1"
                          onClick={(e) => {
                            e.stopPropagation()
                          }}
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span className="text-xs">Change Status</span>
                        </Button>
                        <div className="absolute right-0 hidden group-hover:flex flex-col bg-popover border border-border rounded-lg shadow-lg mt-1 z-20 min-w-[140px]">
                          {["Todo", "Planning", "In Progress", "Done"].map((status) => (
                            <button
                              key={status}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleStatusChange(task.id, status as "Todo" | "Planning" | "In Progress" | "Done")
                              }}
                              className={`px-4 py-2 text-left hover:bg-muted/50 text-sm border-b border-border last:border-0 ${task.status === status ? "bg-muted font-medium" : ""
                                }`}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Delete Button (Admin only) */}
                      {user?.role === "Admin" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeleteConfirmation({ isOpen: true, taskId: task.id, taskTitle: task.title })
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}

                      <div
                        className={`text-xs font-medium px-2.5 py-1 rounded-full border ${getStatusColor(task.status)}`}
                      >
                        {task.status}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-wrap">
                      {/* Project Badge */}
                      <span className="text-xs bg-muted/50 text-muted-foreground px-2 py-1 rounded">
                        {task.project}
                      </span>

                      {/* Priority Badge */}
                      <span className={`text-xs font-medium px-2 py-1 rounded ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>

                      {/* Due Date */}
                      <span className="text-xs text-muted-foreground">{task.dueDate}</span>
                    </div>

                    {/* Skills */}
                    <div className="flex gap-1 flex-wrap justify-end">
                      {task.skills.slice(0, 2).map((skill) => (
                        <span key={skill} className="text-xs bg-muted/50 text-muted-foreground px-2 py-1 rounded">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Subtasks Progress */}
                  {task.subtasks.length > 0 && (
                    <div className="pt-2 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-2">
                        Subtasks: {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length}
                      </p>
                      <div className="space-y-1">
                        {task.subtasks.map((subtask) => (
                          <div key={subtask.id} className="flex items-center gap-2 text-xs">
                            {subtask.completed ? (
                              <CheckCircle2 className="w-3 h-3 text-green-600" />
                            ) : (
                              <Circle className="w-3 h-3 text-muted-foreground" />
                            )}
                            <span
                              className={subtask.completed ? "line-through text-muted-foreground" : "text-foreground"}
                            >
                              {subtask.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Expanded Details */}
                  {expandedTask === task.id && (
                    <div className="pt-3 border-t border-border space-y-2">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-medium text-muted-foreground">Full Description</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCopyDescription(task.description, task.title)
                            }}
                          >
                            <Copy className="w-3 h-3 mr-1" />
                            Copy
                          </Button>
                        </div>
                        <p className="text-sm text-foreground">{task.description}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Project</p>
                        <p className="text-sm text-foreground">{task.project}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-2">No tasks found</p>
            <p className="text-sm text-muted-foreground">Try adjusting your filters or search query</p>
          </div>
        )}
      </div>

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isCreateTaskOpen}
        onClose={() => {
          setIsCreateTaskOpen(false)
          fetchTasks() // Refresh tasks after creating new one
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmation.isOpen} onOpenChange={(open) => !open && setDeleteConfirmation({ isOpen: false, taskId: "", taskTitle: "" })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <span className="font-semibold text-foreground">"{deleteConfirmation.taskTitle}"</span>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTask} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Delete Task
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
