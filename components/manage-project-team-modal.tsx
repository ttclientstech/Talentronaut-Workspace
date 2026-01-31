"use client"

import { useState, useEffect } from "react"
import { Users, Plus, X, Loader2, Crown, Shield, Search, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAuth } from "@/lib/auth-context"

interface ManageProjectTeamModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string | null
  onTeamUpdate?: () => void
}

interface Member {
  id: string
  name: string
  email: string
  role: string
  skills: string[]
}

interface ProjectCreator {
  id: string
  name: string
  email: string
  role: string
}

export default function ManageProjectTeamModal({
  isOpen,
  onClose,
  projectId,
  onTeamUpdate,
}: ManageProjectTeamModalProps) {
  const { user } = useAuth()
  const [teamMembers, setTeamMembers] = useState<Member[]>([])
  const [orgMembers, setOrgMembers] = useState<Member[]>([])
  const [projectLead, setProjectLead] = useState<Member | null>(null)
  const [projectCreator, setProjectCreator] = useState<ProjectCreator | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showAddMembers, setShowAddMembers] = useState(false)

  // Fetch all organization members to populate the add list
  const fetchOrgMembers = async () => {
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
        // Map API response to Member interface (simplify role)
        const mappedMembers = data.members.map((m: any) => ({
          id: m.id,
          name: m.name,
          email: m.email,
          role: m.role,
          skills: m.skills || []
        }))
        setOrgMembers(mappedMembers)
      }
    } catch (error) {
      console.error("Error fetching org members:", error)
    }
  }


  // Fetch project team members
  const fetchProjectTeam = async () => {
    if (!projectId) return

    try {
      setIsLoading(true)
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/projects/${projectId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      })

      const data = await response.json()

      if (data.success && data.project) {
        setTeamMembers(data.project.members || [])
        setProjectLead({
          id: data.project.leadId,
          name: data.project.lead,
          email: data.project.leadEmail,
          role: "Lead",
          skills: [],
        })

        // Set project creator if available
        if (data.project.createdById) {
          setProjectCreator({
            id: data.project.createdById,
            name: data.project.createdBy,
            email: data.project.createdByEmail,
            role: data.project.createdByRole,
          })
        }
      }
    } catch (error) {
      console.error("Error fetching project team:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && projectId) {
      fetchProjectTeam()
      fetchOrgMembers()
      setShowAddMembers(false)
      setSearchQuery("")
    }
  }, [isOpen, projectId])

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!projectId) return

    // Check if trying to remove lead or creator
    if (memberId === projectLead?.id) {
      alert("Cannot remove the project lead from the team.")
      return
    }

    if (memberId === projectCreator?.id) {
      alert("Cannot remove the project creator from the team.")
      return
    }

    if (!confirm(`Remove ${memberName} from this project?`)) {
      return
    }

    try {
      setIsProcessing(true)
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/projects/${projectId}/members?memberId=${memberId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      })

      const data = await response.json()

      if (data.success) {
        setTeamMembers((prev) => prev.filter((m) => m.id !== memberId))
        onTeamUpdate?.()
      } else {
        alert(data.error || "Failed to remove member")
      }
    } catch (error) {
      console.error("Error removing member:", error)
      alert("Failed to remove member")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleAddMember = async (member: Member) => {
    if (!projectId) return

    try {
      setIsProcessing(true)
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/projects/${projectId}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({ memberId: member.id }),
      })

      const data = await response.json()

      if (data.success) {
        setTeamMembers((prev) => [...prev, data.member])
        setSearchQuery("")
        onTeamUpdate?.()
      } else {
        alert(data.error || "Failed to add member")
      }
    } catch (error) {
      console.error("Error adding member:", error)
      alert("Failed to add member")
    } finally {
      setIsProcessing(false)
    }
  }

  // Get available members (org members not in project, excluding the lead and creator)
  const filteredAvailable = orgMembers.filter(
    (m) =>
      !teamMembers.find((tm) => tm.id === m.id) &&
      m.id !== projectLead?.id &&
      m.id !== projectCreator?.id &&
      m.role === "Member" && // Only show members, not other leads or admins
      (m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.email.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "Admin":
        return "bg-purple-500/10 text-purple-700 dark:text-purple-400"
      case "Lead":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400"
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400"
    }
  }

  const getAvatarColor = (role: string) => {
    switch (role) {
      case "Admin":
        return "bg-purple-500"
      case "Lead":
        return "bg-blue-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0">
        {/* Header */}
        <div className="px-6 py-5 border-b">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold flex items-center gap-2">
              <Users className="w-5 h-5 text-muted-foreground" />
              Team Members
            </DialogTitle>
            <DialogDescription className="mt-1">
              Manage who has access to this project
            </DialogDescription>
          </DialogHeader>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex flex-col max-h-[calc(85vh-120px)]">
            {/* Members List */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-2">
                {/* Project Creator */}
                {projectCreator && (
                  <div className="flex items-center gap-3 py-3 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className={`w-10 h-10 rounded-full ${getAvatarColor(projectCreator.role)} flex items-center justify-center text-white text-sm font-medium`}>
                      {getInitials(projectCreator.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{projectCreator.name}</p>
                        <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{projectCreator.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-md font-medium ${getRoleBadgeColor(projectCreator.role)}`}>
                        {projectCreator.role}
                      </span>
                      <Shield className="w-4 h-4 text-muted-foreground/50" />
                    </div>
                  </div>
                )}

                {/* Project Lead */}
                {projectLead && projectLead.id !== projectCreator?.id && (
                  <div className="flex items-center gap-3 py-3 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className={`w-10 h-10 rounded-full ${getAvatarColor("Lead")} flex items-center justify-center text-white text-sm font-medium`}>
                      {getInitials(projectLead.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{projectLead.name}</p>
                        {user?.id === projectLead.id && (
                          <span className="text-xs px-1.5 py-0.5 bg-blue-500/10 text-blue-700 dark:text-blue-400 rounded">You</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{projectLead.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-md font-medium ${getRoleBadgeColor("Lead")}`}>
                        Lead
                      </span>
                      <Shield className="w-4 h-4 text-muted-foreground/50" />
                    </div>
                  </div>
                )}

                {/* Divider */}
                {(projectCreator || projectLead) && teamMembers.length > 0 && (
                  <div className="border-t my-2" />
                )}

                {/* Team Members */}
                {(() => {
                  const filteredMembers = teamMembers.filter(
                    (member) => member.id !== projectLead?.id && member.id !== projectCreator?.id
                  )

                  if (filteredMembers.length === 0) {
                    return (
                      <div className="text-center py-8 text-sm text-muted-foreground">
                        No team members yet
                      </div>
                    )
                  }

                  return filteredMembers.map((member) => {
                    const isCurrentUser = member.id === user?.id
                    // Can remove if not Admin or Lead role
                    const canRemove = member.role !== "Admin" && member.role !== "Lead"

                    return (
                      <div
                        key={member.id}
                        className="flex items-center gap-3 py-3 px-3 rounded-lg hover:bg-muted/50 transition-colors group"
                      >
                        <div className={`w-10 h-10 rounded-full ${getAvatarColor(member.role)} flex items-center justify-center text-white text-sm font-medium`}>
                          {getInitials(member.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium truncate">{member.name}</p>
                            {isCurrentUser && (
                              <span className="text-xs px-1.5 py-0.5 bg-blue-500/10 text-blue-700 dark:text-blue-400 rounded">You</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-1 rounded-md font-medium ${getRoleBadgeColor(member.role)}`}>
                            {member.role}
                          </span>
                          {canRemove ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveMember(member.id, member.name)}
                              disabled={isProcessing}
                              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          ) : (
                            <div className="h-8 w-8 flex items-center justify-center">
                              <Shield className="w-4 h-4 text-muted-foreground/50" />
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })
                })()}
              </div>
            </div>

            {/* Add Members Section */}
            {showAddMembers ? (
              <div className="border-t bg-muted/30">
                <div className="px-6 py-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Search className="w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search members to add..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1 h-9 text-sm"
                      autoFocus
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowAddMembers(false)
                        setSearchQuery("")
                      }}
                      className="h-9"
                    >
                      Cancel
                    </Button>
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {filteredAvailable.length > 0 ? (
                      filteredAvailable.map((member) => (
                        <button
                          key={member.id}
                          onClick={() => handleAddMember(member)}
                          disabled={isProcessing}
                          className="w-full flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-background transition-colors text-left"
                        >
                          <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center text-white text-xs font-medium">
                            {getInitials(member.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{member.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                          </div>
                          <Plus className="w-4 h-4 text-muted-foreground shrink-0" />
                        </button>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        {searchQuery ? "No members found" : "All members are already in this project"}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : null}

            {/* Footer */}
            <div className="px-6 py-4 border-t bg-muted/30 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {teamMembers.length + (projectLead ? 1 : 0) + (projectCreator && projectCreator.id !== projectLead?.id ? 1 : 0)} member{teamMembers.length + (projectLead ? 1 : 0) + (projectCreator && projectCreator.id !== projectLead?.id ? 1 : 0) !== 1 ? 's' : ''}
              </div>
              <div className="flex gap-2">
                {!showAddMembers && filteredAvailable.length > 0 && (
                  <Button
                    onClick={() => setShowAddMembers(true)}
                    size="sm"
                    variant="outline"
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Member
                  </Button>
                )}
                <Button onClick={onClose} size="sm">
                  Done
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
