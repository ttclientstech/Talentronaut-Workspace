"use client"

import { useState, useEffect } from "react"
import { Users, ChevronDown, Trash2, Plus, RefreshCw, UserCheck, Shield, XCircle, ArrowLeft, Mail, Phone, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"

interface User {
  _id: string
  name: string
  email: string
  profilePicture?: string
  role: "Admin" | "Lead" | "Member"
}

interface Team {
  _id: string
  name: string
  leader?: User
  members: User[]
  description?: string
}

interface TeamsViewProps {
  onViewChange?: (view: "dashboard" | "projects" | "tasks" | "members") => void
}

export default function TeamsView({ onViewChange }: TeamsViewProps) {
  const { user } = useAuth()
  const [teams, setTeams] = useState<Team[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // View Mode
  const [viewingTeam, setViewingTeam] = useState<Team | null>(null)

  // Create Team State
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false)
  const [newTeamName, setNewTeamName] = useState("")
  const [newTeamLeader, setNewTeamLeader] = useState<string>("")
  const [newTeamMembers, setNewTeamMembers] = useState<string[]>([])
  const [newTeamDescription, setNewTeamDescription] = useState("")

  // Manage Team State
  const [isManageTeamOpen, setIsManageTeamOpen] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [membersToAdd, setMembersToAdd] = useState<string[]>([])

  const fetchTeamsAndUsers = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem("token")

      const [teamsRes, usersRes] = await Promise.all([
        fetch("/api/teams", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/members", { headers: { Authorization: `Bearer ${token}` } }),
      ])

      const teamsData = await teamsRes.json()
      const usersData = await usersRes.json()

      if (teamsData.success) {
        setTeams(teamsData.teams)
        // If we are viewing a team, update its data to reflect changes
        if (viewingTeam) {
          const updatedViewingTeam = teamsData.teams.find((t: Team) => t._id === viewingTeam._id)
          if (updatedViewingTeam) setViewingTeam(updatedViewingTeam)
        }
      }
      if (usersData.success) setUsers(usersData.members.map((m: any) => ({ ...m, _id: m.id })))

    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTeamsAndUsers()
  }, [])

  const handleCreateTeam = async () => {
    if (!newTeamName) return alert("Team name is required")

    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: newTeamName,
          leaderId: newTeamLeader || undefined,
          memberIds: newTeamMembers,
          description: newTeamDescription
        }),
      })

      const data = await response.json()
      if (data.success) {
        setTeams([data.team, ...teams])
        setIsCreateTeamOpen(false)
        setNewTeamName("")
        setNewTeamLeader("")
        setNewTeamMembers([])
        setNewTeamDescription("")
        alert("Team created successfully")
      } else {
        alert(data.error)
      }
    } catch (error) {
      console.error(error)
      alert("Failed to create team")
    }
  }

  const handleUpdateTeamMembers = async () => {
    if (!selectedTeam) return

    try {
      const token = localStorage.getItem("token")
      const currentMemberIds = selectedTeam.members.map(m => m._id)
      const updatedMemberIds = Array.from(new Set([...currentMemberIds, ...membersToAdd]))

      const response = await fetch(`/api/teams/${selectedTeam._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          memberIds: updatedMemberIds
        }),
      })

      const data = await response.json()
      if (data.success) {
        setTeams(teams.map(t => t._id === selectedTeam._id ? data.team : t))
        if (viewingTeam && viewingTeam._id === selectedTeam._id) {
          setViewingTeam(data.team)
        }
        setIsManageTeamOpen(false)
        setMembersToAdd([])
        setSelectedTeam(null)
        alert("Team members updated")
      } else {
        alert(data.error)
      }
    } catch (error) {
      console.error(error)
      alert("Failed to update team")
    }
  }

  const handleRemoveMember = async (teamId: string, memberId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return

    try {
      const team = teams.find(t => t._id === teamId)
      if (!team) return

      const updatedMemberIds = team.members.filter(m => m._id !== memberId).map(m => m._id)
      const token = localStorage.getItem("token")

      const response = await fetch(`/api/teams/${teamId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          memberIds: updatedMemberIds
        }),
      })

      const data = await response.json()
      if (data.success) {
        setTeams(teams.map(t => t._id === teamId ? data.team : t))
        if (viewingTeam && viewingTeam._id === teamId) {
          setViewingTeam(data.team)
        }
      } else {
        alert(data.error)
      }

    } catch (error) {
      console.error("Error removing member:", error)
      alert("Failed to remove member")
    }
  }

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm("Are you sure you want to delete this team?")) return

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/teams/${teamId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        setTeams(teams.filter(t => t._id !== teamId))
      } else {
        alert("Failed to delete team")
      }
    } catch (error) {
      console.error(error)
    }
  }

  // Permissions
  const canCreateTeam = user?.role === "Admin"
  const canEditTeam = (team: Team) => user?.role === "Admin" || (user?.role === "Lead" && team.leader?._id === user.id)

  if (isLoading) {
    return <div className="p-8 flex justify-center text-muted-foreground">Loading teams...</div>
  }

  return (
    <div className="p-8">
      {/* Header */}
      {!viewingTeam && (
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
              <Users className="w-8 h-8" />
              Teams
            </h2>
            <p className="text-muted-foreground">
              Manage your organization's teams and members
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchTeamsAndUsers} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" /> Refresh
            </Button>
            {canCreateTeam && (
              <Button onClick={() => setIsCreateTeamOpen(true)}>
                <Plus className="w-4 h-4 mr-2" /> Create Team
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      {viewingTeam ? (
        <div className="space-y-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setViewingTeam(null)}>
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <div>
              <h2 className="text-3xl font-bold">{viewingTeam.name}</h2>
              {viewingTeam.description && <p className="text-muted-foreground mt-1">{viewingTeam.description}</p>}
            </div>
            <div className="ml-auto flex gap-2">
              {canEditTeam(viewingTeam) && (
                <Button
                  onClick={() => { setSelectedTeam(viewingTeam); setIsManageTeamOpen(true); }}
                >
                  <UserCheck className="w-4 h-4 mr-2" /> Add Members
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Team Info Card */}
            <Card className="md:col-span-1 h-fit">
              <CardHeader>
                <CardTitle>Team Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-muted-foreground text-xs uppercase tracking-wide">Leader</Label>
                  <div className="flex items-center gap-3 mt-1">
                    {viewingTeam.leader ? (
                      <>
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {viewingTeam.leader.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">{viewingTeam.leader.name}</p>
                          <p className="text-xs text-muted-foreground">{viewingTeam.leader.email}</p>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">No leader assigned</p>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs uppercase tracking-wide">Members</Label>
                  <p className="text-2xl font-bold mt-1">{viewingTeam.members.length}</p>
                </div>
              </CardContent>
            </Card>

            {/* Members List */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>People currently in this team.</CardDescription>
              </CardHeader>
              <CardContent>
                {viewingTeam.members.length > 0 ? (
                  <div className="space-y-4">
                    {viewingTeam.members.map(member => (
                      <div key={member._id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-sm">
                            {member.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium">{member.name}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {member.email}</span>
                              <span className="capitalize bg-secondary/50 px-1.5 py-0.5 rounded">{member.role}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => alert(`View Profile for ${member.name} - Coming Soon`)}
                          >
                            <Eye className="w-4 h-4 mr-1" /> View Profile
                          </Button>
                          {canEditTeam(viewingTeam) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                              onClick={() => handleRemoveMember(viewingTeam._id, member._id)}
                            >
                              <Trash2 className="w-4 h-4 mr-1" /> Remove
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground italic">
                    No members in this team yet.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <Card key={team._id} className="flex flex-col cursor-pointer hover:border-primary/50 transition-all shadow-sm hover:shadow-md" onClick={() => setViewingTeam(team)}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl hover:underline decoration-primary underline-offset-4">{team.name}</CardTitle>
                  {user?.role === "Admin" && (
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={(e) => { e.stopPropagation(); handleDeleteTeam(team._id); }}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <CardDescription>
                  {team.leader ? (
                    <span className="flex items-center gap-1 text-primary font-medium">
                      <Shield className="w-3 h-3" /> Leader: {team.leader.name}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">No leader assigned</span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="flex-1">
                  {team.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{team.description}</p>}
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Members ({team.members.length})</h4>
                  <div className="space-y-2 mb-4">
                    {team.members.length > 0 ? (
                      team.members.slice(0, 5).map(m => (
                        <div key={m._id} className="flex items-center gap-2 text-sm">
                          <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold">
                            {m.name.charAt(0)}
                          </div>
                          <span className="truncate">{m.name}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No members yet</p>
                    )}
                    {team.members.length > 5 && (
                      <p className="text-xs text-muted-foreground">+ {team.members.length - 5} more</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 mt-auto">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={(e) => { e.stopPropagation(); setViewingTeam(team); }}
                  >
                    View Details
                  </Button>
                  {canEditTeam(team) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={(e) => { e.stopPropagation(); setSelectedTeam(team); setIsManageTeamOpen(true); }}
                    >
                      <UserCheck className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {teams.length === 0 && (
            <div className="col-span-full py-12 text-center border-2 border-dashed rounded-xl text-muted-foreground">
              No teams found. {canCreateTeam ? "Create one to get started!" : ""}
            </div>
          )}
        </div>
      )}

      {/* Create Team Modal */}
      <Dialog open={isCreateTeamOpen} onOpenChange={setIsCreateTeamOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Team</DialogTitle>
            <DialogDescription>Define a new team and assign a leader.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Team Name</Label>
              <Input value={newTeamName} onChange={e => setNewTeamName(e.target.value)} placeholder="e.g. Development, Marketing" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={newTeamDescription} onChange={e => setNewTeamDescription(e.target.value)} placeholder="Team purpose and goals..." />
            </div>
            <div className="space-y-2">
              <Label>Assign Leader (Optional)</Label>
              <Select value={newTeamLeader} onValueChange={setNewTeamLeader}>
                <SelectTrigger><SelectValue placeholder="Select a leader" /></SelectTrigger>
                <SelectContent>
                  {users.map(u => (
                    <SelectItem key={u._id} value={u._id}>{u.name} ({u.role})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Simple multi-select logic implementation could go here, or just basic creation first */}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsCreateTeamOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateTeam}>Create Team</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage/Add Members Modal */}
      <Dialog open={isManageTeamOpen} onOpenChange={setIsManageTeamOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Team: {selectedTeam?.name}</DialogTitle>
            <DialogDescription>Add new members to the team.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Add Members</Label>
              <Select onValueChange={(val) => {
                if (!membersToAdd.includes(val) && !selectedTeam?.members.some(m => m._id === val)) {
                  setMembersToAdd([...membersToAdd, val])
                }
              }}>
                <SelectTrigger><SelectValue placeholder="Select member to add" /></SelectTrigger>
                <SelectContent>
                  {users
                    .filter(u => !selectedTeam?.members.some(m => m._id === u._id) && !membersToAdd.includes(u._id))
                    .map(u => (
                      <SelectItem key={u._id} value={u._id}>{u.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>

              {/* Selected to add list */}
              <div className="flex flex-wrap gap-2 mt-2">
                {membersToAdd.map(id => {
                  const u = users.find(user => user._id === id)
                  return u ? (
                    <Badge key={id} variant="secondary" className="flex items-center gap-1">
                      {u.name}
                      <XCircle className="w-3 h-3 cursor-pointer" onClick={() => setMembersToAdd(membersToAdd.filter(i => i !== id))} />
                    </Badge>
                  ) : null
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsManageTeamOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateTeamMembers} disabled={membersToAdd.length === 0}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

