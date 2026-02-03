"use client"

import { useState, useEffect } from "react"
import { Plus, Search, MoreVertical, RefreshCw, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import CreateProjectModal from "./create-project-modal"
import { useAuth } from "@/lib/auth-context"

interface Project {
  id: string
  name: string
  description: string
  lead: string
  leadEmail: string
  members: number
  status: string
  progress: number
  tasks: number
  completedTasks?: number
  dueDate: string
  priority: string
}

interface ProjectsViewProps {
  onProjectSelect: (projectId: string) => void
}

export default function ProjectsView({ onProjectSelect }: ProjectsViewProps) {
  const { user } = useAuth()
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")

  // Fetch projects from API
  const fetchProjects = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      setError(null)
      const token = localStorage.getItem("token")
      const response = await fetch("/api/projects", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      })

      const data = await response.json()

      if (data.success && data.projects) {
        setProjects(data.projects)
      } else {
        setError(data.error || "Failed to fetch projects")
      }
    } catch (error) {
      console.error("Error fetching projects:", error)
      setError("Failed to fetch projects")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [user])

  // Filter projects based on search query and status
  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.lead.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "All" || project.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical":
        return "bg-destructive/20 text-destructive border-destructive/30"
      case "High":
        return "bg-orange-100/20 text-orange-700 border-orange-200/30"
      case "Medium":
        return "bg-yellow-100/20 text-yellow-700 border-yellow-200/30"
      default:
        return "bg-green-100/20 text-green-700 border-green-200/30"
    }
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading projects...</p>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <p className="text-destructive mb-2">Error: {error}</p>
          <Button onClick={fetchProjects} variant="outline">
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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">Projects</h2>
          <p className="text-muted-foreground">
            Manage and organize your team projects • {projects.length} total
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchProjects} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={() => setIsCreateProjectOpen(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Status Filter */}
        <div className="w-full sm:w-[200px]">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <SelectValue placeholder="Filter by Status" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Statuses</SelectItem>
              <SelectItem value="Not Started">Not Started</SelectItem>
              <SelectItem value="Planning">Planning</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="On Hold">On Hold</SelectItem>
              <SelectItem value="Closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Card
              key={project.id}
              className="hover:shadow-lg transition-shadow cursor-pointer overflow-hidden group"
              onClick={() => onProjectSelect(project.id)}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between mb-2">
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">{project.name}</CardTitle>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
                <CardDescription>{project.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-foreground">Progress</span>
                    <span className="text-sm text-muted-foreground">{project.progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all" style={{ width: `${project.progress}%` }} />
                  </div>
                </div>

                {/* Project Info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Lead</p>
                    <p className="font-medium text-foreground">{project.lead}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Team</p>
                    <p className="font-medium text-foreground">{project.members} members</p>
                  </div>
                </div>

                {/* Status and Priority */}
                <div className="flex gap-2">
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/20 text-primary border border-primary/30">
                    {project.status}
                  </span>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full border ${getPriorityColor(project.priority)}`}
                  >
                    {project.priority}
                  </span>
                </div>

                {/* Task Count and Status */}
                <div className="pt-2 border-t border-border">
                  {project.tasks > 0 ? (
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">{project.completedTasks || 0}</span> of{" "}
                      <span className="font-medium text-foreground">{project.tasks}</span> tasks completed
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No tasks yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-2">No projects found</p>
          {searchQuery ? (
            <p className="text-sm text-muted-foreground">Try adjusting your search query</p>
          ) : (
            <Button onClick={() => setIsCreateProjectOpen(true)} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Project
            </Button>
          )}
        </div>
      )}

      <CreateProjectModal
        isOpen={isCreateProjectOpen}
        onClose={() => {
          setIsCreateProjectOpen(false)
          fetchProjects() // Refresh projects after creating new one
        }}
      />
    </div>
  )
}
