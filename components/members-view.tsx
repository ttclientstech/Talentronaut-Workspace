"use client"

import { useState, useEffect } from "react"
import { Users, ChevronDown, Trash2, Clock, CheckCircle, XCircle, RefreshCw, Undo2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"

interface PendingMember {
  id: string
  userId: string
  name: string
  email: string
  profilePicture?: string
  requestDate: string
}

interface Member {
  id: string
  name: string
  email: string
  role: "Admin" | "Lead" | "Member"
  skills: string[]
  projects: string[]
  previousRole?: "Admin" | "Lead" | "Member"
}

interface MembersViewProps {
  onViewChange?: (view: "dashboard" | "projects" | "tasks" | "members") => void
}

export default function MembersView({ onViewChange }: MembersViewProps) {
  const { user } = useAuth()
  const [members, setMembers] = useState<Member[]>([])
  const [isLoadingMembers, setIsLoadingMembers] = useState(true)
  const [selectedRole, setSelectedRole] = useState<Record<string, boolean>>({})
  const [pendingMembers, setPendingMembers] = useState<PendingMember[]>([])
  const [isLoadingRequests, setIsLoadingRequests] = useState(false)

  // Fetch members with project details
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
        setMembers(data.members)
      } else {
        setMembers([])
      }
    } catch (error) {
      console.error("Error fetching members:", error)
      setMembers([])
    } finally {
      setIsLoadingMembers(false)
    }
  }

  // Fetch pending member requests from API
  const fetchPendingRequests = async () => {
    try {
      setIsLoadingRequests(true)
      const token = localStorage.getItem("token")
      const response = await fetch("/api/member-requests/pending", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      })

      const data = await response.json()

      if (data.success && data.requests) {
        const formattedRequests = data.requests.map((req: any) => ({
          id: req.id,
          userId: req.user.id,
          name: req.user.name,
          email: req.user.email,
          profilePicture: req.user.profilePicture,
          requestDate: req.requestedAt,
        }))
        setPendingMembers(formattedRequests)
      }
    } catch (error) {
      console.error("Error fetching pending requests:", error)
    } finally {
      setIsLoadingRequests(false)
    }
  }

  useEffect(() => {
    fetchMembers()
    fetchPendingRequests()
  }, [])

  const handleApprove = async (pendingMember: PendingMember) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/member-requests/${pendingMember.id}/process`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({ action: "approve" }),
      })

      const data = await response.json()

      if (data.success) {
        // Remove from pending list
        setPendingMembers((prev) => prev.filter((p) => p.id !== pendingMember.id))
        alert(`${pendingMember.name} has been approved and can now access the organization!`)
        // Refresh members list
        await fetchMembers()
      } else {
        alert(data.error || "Failed to approve request")
      }
    } catch (error) {
      console.error("Error approving request:", error)
      alert("Failed to approve request")
    }
  }

  const handleReject = async (pendingMember: PendingMember) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/member-requests/${pendingMember.id}/process`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({ action: "reject" }),
      })

      const data = await response.json()

      if (data.success) {
        // Remove from pending list
        setPendingMembers((prev) => prev.filter((p) => p.id !== pendingMember.id))
        alert(`${pendingMember.name}'s request has been rejected.`)
      } else {
        alert(data.error || "Failed to reject request")
      }
    } catch (error) {
      console.error("Error rejecting request:", error)
      alert("Failed to reject request")
    }
  }

  const handleRoleChange = async (memberId: string, newRole: "Admin" | "Lead" | "Member") => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/members/${memberId}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({ newRole }),
      })

      const data = await response.json()

      if (data.success) {
        // Update local state with previous role
        setMembers((prev) =>
          prev.map((m) =>
            m.id === memberId
              ? {
                ...m,
                role: newRole,
                previousRole: data.user.previousRole,
              }
              : m,
          ),
        )
        alert(data.message)
        setSelectedRole((prev) => ({ ...prev, [memberId]: false }))
      } else {
        alert(data.error || "Failed to update role")
        setSelectedRole((prev) => ({ ...prev, [memberId]: false }))
      }
    } catch (error) {
      console.error("Error updating role:", error)
      alert("Failed to update role")
      setSelectedRole((prev) => ({ ...prev, [memberId]: false }))
    }
  }

  const handleRevertRole = async (member: Member) => {
    if (!member.previousRole) return

    if (
      !confirm(
        `Are you sure you want to revert ${member.name}'s role back to ${member.previousRole}? They are currently ${member.role}.`,
      )
    ) {
      return
    }

    await handleRoleChange(member.id, member.previousRole)
  }

  const handleRemoveMember = async (member: Member) => {
    if (
      !confirm(
        `Are you sure you want to remove ${member.name} from the organization? This action cannot be undone.\n\nNote: Members can only be removed if they have no assigned tasks or projects.`,
      )
    ) {
      return
    }

    try {
      // For Single Company mode, we just remove the user for now
      // In a real app we might want to deactivate or similar, but DELETE is fine
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/members/${member.id}/remove`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      })

      const data = await response.json()

      if (data.success) {
        // Remove from local state
        setMembers((prev) => prev.filter((m) => m.id !== member.id))
        alert(data.message)
      } else {
        alert(data.error || "Failed to remove member")
      }
    } catch (error) {
      console.error("Error removing member:", error)
      alert("Failed to remove member")
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "Admin":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
      case "Lead":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
      case "Member":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  // Show loading state
  if (isLoadingMembers) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading team members...</p>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
            <Users className="w-8 h-8" />
            Team Members
          </h2>
          <p className="text-muted-foreground">
            Manage your team members ({members.length} {members.length === 1 ? "member" : "members"})
          </p>
        </div>
        <Button
          onClick={() => {
            fetchMembers()
            fetchPendingRequests()
          }}
          variant="outline"
          size="sm"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Pending Requests Section */}
      {pendingMembers.length > 0 && (
        <Card className="mb-8 border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-900/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-500">
              <Clock className="w-5 h-5" />
              Pending Requests ({pendingMembers.length})
            </CardTitle>
            <CardDescription>Review and approve new member requests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingMembers.map((pendingMember) => (
                <div
                  key={pendingMember.id}
                  className="flex items-center justify-between p-4 bg-background rounded-lg border border-border"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                      {pendingMember.profilePicture || pendingMember.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{pendingMember.name}</p>
                      <p className="text-sm text-muted-foreground">{pendingMember.email}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Requested: {new Date(pendingMember.requestDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleApprove(pendingMember)}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button onClick={() => handleReject(pendingMember)} variant="outline" className="text-red-600">
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {members.length > 0 ? (
          members.map((member) => (
            <Card key={member.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                      {member.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate">{member.name}</CardTitle>
                      <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Role Badge with Dropdown */}
                <div className="relative">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">Role:</span>
                    <div className="relative flex items-center gap-2">
                      {/* Check if this is the current user (admin cannot change own role) */}
                      {user?.email === member.email ? (
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(member.role)}`}>
                          {member.role} (You)
                        </span>
                      ) : (
                        <>
                          <button
                            onClick={() => setSelectedRole((prev) => ({ ...prev, [member.id]: !prev[member.id] }))}
                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium transition-colors ${getRoleColor(member.role)}`}
                          >
                            {member.role}
                            <ChevronDown className="w-3 h-3" />
                          </button>

                          {/* Revert Button */}
                          {member.previousRole && member.previousRole !== member.role && (
                            <button
                              onClick={() => handleRevertRole(member)}
                              className="p-1 rounded hover:bg-muted transition-colors"
                              title={`Revert to ${member.previousRole}`}
                            >
                              <Undo2 className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                            </button>
                          )}

                          {/* Dropdown Menu - Only Admin and Member, no Lead */}
                          {selectedRole[member.id] && (
                            <div className="absolute top-full mt-1 left-0 bg-background border border-border rounded-lg shadow-lg z-10 min-w-[120px]">
                              {(["Admin", "Member"] as const).map((role) => (
                                <button
                                  key={role}
                                  onClick={() => handleRoleChange(member.id, role)}
                                  className={`w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors ${member.role === role ? "bg-muted font-medium" : ""}`}
                                >
                                  {role}
                                </button>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Projects */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Projects:</p>
                  <div className="flex flex-wrap gap-2">
                    {member.projects && member.projects.length > 0 ? (
                      member.projects.map((project, idx) => (
                        <span key={idx} className="inline-block bg-muted text-muted-foreground text-xs px-2 py-1 rounded">
                          {project}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground italic">No projects assigned</span>
                    )}
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Skills:</p>
                  <div className="flex flex-wrap gap-2">
                    {member.skills && member.skills.length > 0 ? (
                      member.skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="inline-block bg-secondary/20 text-secondary text-xs px-2 py-1 rounded"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground italic">No skills listed</span>
                    )}
                  </div>
                </div>

                {/* Remove Member Button */}
                {member.role !== "Admin" && (
                  <div className="pt-2 border-t border-border">
                    <Button
                      onClick={() => handleRemoveMember(member)}
                      variant="outline"
                      size="sm"
                      className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-3 h-3 mr-2" />
                      Remove from Organization
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-8">
            <p className="text-muted-foreground">No members found</p>
          </div>
        )}
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Team Summary</CardTitle>
          <CardDescription>Overview of team composition</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground mb-1">Total Members</p>
              <p className="text-2xl font-bold text-foreground">{members.length}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground mb-1">Admins</p>
              <p className="text-2xl font-bold text-foreground">
                {members.filter((m) => m.role === "Admin").length}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground mb-1">Leads</p>
              <p className="text-2xl font-bold text-foreground">
                {members.filter((m) => m.role === "Lead").length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
