"use client"

import { ArrowRight, Users, Briefcase, CheckSquare, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { useState, useEffect } from "react"

interface LeadDashboardProps {
  onViewChange: (view: "dashboard" | "projects" | "tasks" | "members" | "my-tasks") => void
  onOpenAITaskAssigner: () => void
  onOpenManageTeam: () => void
}

interface Project {
  id: string
  name: string
  members: number
  status: string
  progress: number
  tasks: number
}

export default function LeadDashboard({
  onViewChange,
  onOpenAITaskAssigner,
  onOpenManageTeam,
}: LeadDashboardProps) {
  const { user } = useAuth()
  const [leadProjects, setLeadProjects] = useState<Project[]>([])
  const [memberCount, setMemberCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch projects led by the current user
  useEffect(() => {
    const fetchLeadProjects = async () => {
      if (!user) return

      try {
        setIsLoading(true)
        const token = localStorage.getItem("token")

        // Fetch projects
        const response = await fetch("/api/projects/lead", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        })

        const data = await response.json()

        if (data.success) {
          setLeadProjects(data.projects)
        }

        // Fetch members count (all members in the company)
        // Alternatively we could fetch only members in lead's projects if that's the intent
        // based on the previous code using `members` from context, it was likely all org members
        const membersResponse = await fetch("/api/members", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        })
        const membersData = await membersResponse.json()
        if (membersData.success && membersData.members) {
          setMemberCount(membersData.members.length)
        }

      } catch (error) {
        console.error("Error fetching lead dashboard data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLeadProjects()
  }, [user])

  const activeProjects = leadProjects.length
  const pendingTasks = leadProjects.reduce((sum, p) => sum + p.tasks, 0)

  return (
    <div className="p-8">

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold text-foreground">{activeProjects}</p>
              <Briefcase className="w-8 h-8 text-primary opacity-60" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Team Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold text-foreground">{memberCount}</p>
              <Users className="w-8 h-8 text-accent opacity-60" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold text-foreground">{pendingTasks}</p>
              <CheckSquare className="w-8 h-8 text-secondary opacity-60" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">AI Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold text-foreground">{Math.round(pendingTasks * 0.8)}</p>
              <Zap className="w-8 h-8 text-primary opacity-60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Projects */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>My Projects</CardTitle>
              <CardDescription>Projects you are leading</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading projects...</p>
                </div>
              ) : leadProjects.length > 0 ? (
                <div className="space-y-4">
                  {leadProjects.map((project) => (
                    <div
                      key={project.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                      onClick={() => onViewChange("projects")}
                    >
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{project.name}</p>
                        <p className="text-sm text-muted-foreground">{project.members} team members • {project.tasks} tasks</p>
                      </div>
                      <div className="text-right">
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden mb-1">
                          <div className="h-full bg-primary transition-all" style={{ width: `${project.progress}%` }} />
                        </div>
                        <p className="text-xs text-muted-foreground">{project.progress}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No projects found. You are not leading any projects yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={() => onViewChange("projects")}
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                View Projects
              </Button>
              <Button
                variant="outline"
                className="w-full bg-transparent border-primary text-primary hover:bg-primary/10"
                onClick={onOpenAITaskAssigner}
              >
                <Zap className="w-4 h-4 mr-2" />
                Assign Tasks with AI
              </Button>
              <Button variant="outline" className="w-full bg-transparent" onClick={onOpenManageTeam}>
                Manage Project Team
              </Button>
            </CardContent>
          </Card>


        </div>
      </div>
    </div>
  )
}
