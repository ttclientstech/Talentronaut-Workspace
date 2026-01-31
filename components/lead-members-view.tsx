"use client"

import { useState, useEffect } from "react"
import { Users, RefreshCw } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"

interface LeadMembersViewProps {
  onViewChange?: (view: "dashboard" | "projects" | "tasks" | "members") => void
}

interface TeamMember {
  id: string
  name: string
  email: string
  role: string
  projects: string[]
  skills: string[]
}

export default function LeadMembersView({ onViewChange }: LeadMembersViewProps) {
  const { user } = useAuth()
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch team members from lead's projects
  const fetchTeamMembers = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      setError(null)
      const token = localStorage.getItem("token")
      const response = await fetch("/api/projects/lead/members", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      })

      const data = await response.json()

      if (data.success) {
        setTeamMembers(data.members)
      } else {
        setError(data.error || "Failed to fetch team members")
      }
    } catch (error) {
      console.error("Error fetching team members:", error)
      setError("Failed to fetch team members")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTeamMembers()
  }, [user])

  // Show loading state
  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading team members...</p>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <p className="text-destructive mb-2">Error: {error}</p>
          <Button onClick={fetchTeamMembers} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  // Helper function to get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
            <Users className="w-8 h-8" />
            My Team Members
          </h2>
          <p className="text-muted-foreground">
            Team members on your projects ({teamMembers.length}{" "}
            {teamMembers.length === 1 ? "member" : "members"})
          </p>
        </div>
        <Button onClick={fetchTeamMembers} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Members Grid */}
      {teamMembers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {teamMembers.map((member) => (
            <Card key={member.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                      {getInitials(member.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate">{member.name}</CardTitle>
                      <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Role Badge */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">Role:</span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100">
                    {member.role}
                  </span>
                </div>

                {/* Projects */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Projects:</p>
                  <div className="flex flex-wrap gap-2">
                    {member.projects.length > 0 ? (
                      member.projects.map((project, idx) => (
                        <span key={idx} className="inline-block bg-muted text-muted-foreground text-xs px-2 py-1 rounded">
                          {project}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">No projects</span>
                    )}
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Skills:</p>
                  <div className="flex flex-wrap gap-2">
                    {member.skills.length > 0 ? (
                      member.skills.map((skill, idx) => (
                        <span key={idx} className="inline-block bg-secondary/20 text-secondary text-xs px-2 py-1 rounded">
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">No skills listed</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 mb-8">
          <p className="text-muted-foreground mb-2">No team members found</p>
          <p className="text-sm text-muted-foreground">
            You don't have any members in your projects yet, or all project members are Leads/Admins
          </p>
        </div>
      )}

      {/* Summary */}
      {teamMembers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Team Summary</CardTitle>
            <CardDescription>Overview of your project teams</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-xs text-muted-foreground mb-1">Total Members</p>
                <p className="text-2xl font-bold text-foreground">{teamMembers.length}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-xs text-muted-foreground mb-1">Active Projects</p>
                <p className="text-2xl font-bold text-foreground">
                  {new Set(teamMembers.flatMap((m) => m.projects)).size}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-xs text-muted-foreground mb-1">Unique Skills</p>
                <p className="text-2xl font-bold text-foreground">
                  {new Set(teamMembers.flatMap((m) => m.skills)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
