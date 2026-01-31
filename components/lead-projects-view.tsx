"use client"

import { useState, useEffect } from "react"
import { Search, MoreVertical, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth-context"

interface LeadProjectsViewProps {
  onProjectSelect: (projectId: string) => void
}

interface Project {
  id: string
  name: string
  description: string
  members: number
  status: string
  progress: number
  tasks: number
  completedTasks?: number
  dueDate: string
  priority: string
}

export default function LeadProjectsView({ onProjectSelect }: LeadProjectsViewProps) {
  const { user } = useAuth()
  const [leadProjects, setLeadProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  // Fetch projects led by current user
  const fetchLeadProjects = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      setError(null)
      const token = localStorage.getItem("token")
      const response = await fetch("/api/projects/lead", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      })

      const data = await response.json()

      if (data.success) {
        setLeadProjects(data.projects)
      } else {
        setError(data.error || "Failed to fetch projects")
      }
    } catch (error) {
      console.error("Error fetching lead projects:", error)
      setError("Failed to fetch projects")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLeadProjects()
  }, [user])

  // Filter projects based on search query
  const filteredProjects = leadProjects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

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
          <Button onClick={fetchLeadProjects} variant="outline">
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
          <h2 className="text-3xl font-bold text-foreground mb-2">My Projects</h2>
          <p className="text-muted-foreground">
            Projects you are leading ({leadProjects.length} {leadProjects.length === 1 ? "project" : "projects"})
          </p>
        </div>
        <Button onClick={fetchLeadProjects} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
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
                    <p className="text-muted-foreground">Team</p>
                    <p className="font-medium text-foreground">{project.members} members</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Tasks</p>
                    {project.tasks > 0 ? (
                      <p className="font-medium text-foreground">
                        {project.completedTasks || 0}/{project.tasks}
                      </p>
                    ) : (
                      <p className="font-medium text-muted-foreground italic">None yet</p>
                    )}
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
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-2">
            {searchQuery ? "No projects found matching your search" : "No projects found"}
          </p>
          <p className="text-sm text-muted-foreground">
            {searchQuery ? "Try adjusting your search query" : "You are not leading any projects yet"}
          </p>
        </div>
      )}
    </div>
  )
}
