"use client"

import { Building2, Copy, Check, Plus, UserPlus, LogOut, Settings, X, ChevronRight } from "lucide-react"
import { useOrganization } from "@/lib/organization-context"
import { useAuth } from "@/lib/auth-context"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface Organization {
  id: string
  name: string
  logo: string
  inviteCode: string
}

export default function OrganizationSwitcher() {
  const { currentOrganization, isLoading, refreshOrganization } = useOrganization()
  const { user, logout, refreshUser } = useAuth()
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [joinCode, setJoinCode] = useState("")
  const [isJoining, setIsJoining] = useState(false)
  const [orgName, setOrgName] = useState("")
  const [orgHandle, setOrgHandle] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [userOrganizations, setUserOrganizations] = useState<Organization[]>([])
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(false)

  const handleCopyInviteCode = () => {
    if (currentOrganization?.inviteCode) {
      navigator.clipboard.writeText(currentOrganization.inviteCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleLeaveOrganization = async () => {
    if (confirm("Are you sure you want to leave this organization?")) {
      try {
        const token = localStorage.getItem("token")
        const response = await fetch("/api/organizations/leave", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        })

        const data = await response.json()

        if (data.success) {
          // Refresh user data and redirect to welcome
          router.push("/welcome")
          router.refresh()
        } else {
          alert(data.error || "Failed to leave organization")
        }
      } catch (error) {
        console.error("Error leaving organization:", error)
        alert("Failed to leave organization")
      }
    }
  }

  const handleCreateOrganization = () => {
    setIsCreateModalOpen(true)
    setIsSettingsOpen(false)
  }

  const handleOrgNameChange = (name: string) => {
    setOrgName(name)
    // Auto-generate handle from name
    const handle = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with single
      .replace(/^-|-$/g, "") // Remove leading/trailing hyphens
    setOrgHandle(handle)
  }

  const handleCreateWithName = async () => {
    if (!orgName.trim() || !orgHandle.trim()) {
      alert("Please enter an organization name")
      return
    }

    try {
      setIsCreating(true)
      const token = localStorage.getItem("token")
      const response = await fetch("/api/organizations/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({ name: orgName.trim(), handle: orgHandle.trim() }),
      })

      const data = await response.json()

      if (data.success) {
        // Update token if provided
        if (data.token) {
          localStorage.setItem("token", data.token)
        }

        // Update user data
        await refreshUser()
        await refreshOrganization()

        // Reset form
        setOrgName("")
        setOrgHandle("")
        setIsCreateModalOpen(false)

        // Show success and reload to switch to new org
        alert("Organization created successfully! Switching to your new organization...")
        window.location.reload()
      } else {
        alert(data.error || "Failed to create organization")
      }
    } catch (error) {
      console.error("Error creating organization:", error)
      alert("Failed to create organization")
    } finally {
      setIsCreating(false)
    }
  }

  const handleJoinOrganization = () => {
    setIsJoinModalOpen(true)
    setIsSettingsOpen(false)
  }

  const handleJoinWithCode = async () => {
    if (!joinCode.trim()) {
      alert("Please enter an invite code")
      return
    }

    try {
      setIsJoining(true)
      const token = localStorage.getItem("token")
      const response = await fetch("/api/organizations/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({ inviteCode: joinCode.trim() }),
      })

      const data = await response.json()

      if (data.success) {
        if (data.status === "pending") {
          alert(
            "Join request sent successfully! Your request is pending admin approval. You will be notified once approved.",
          )
        } else {
          alert("Successfully joined organization! Redirecting...")
          await refreshUser()
          await refreshOrganization()
          router.refresh()
        }
        setJoinCode("")
        setIsJoinModalOpen(false)
      } else {
        alert(data.error || "Failed to join organization")
      }
    } catch (error) {
      console.error("Error joining organization:", error)
      alert("Failed to join organization")
    } finally {
      setIsJoining(false)
    }
  }

  const fetchUserOrganizations = async () => {
    try {
      setIsLoadingOrgs(true)
      const token = localStorage.getItem("token")
      const response = await fetch("/api/organizations/my-organizations", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      })

      const data = await response.json()

      if (data.success && data.organizations) {
        setUserOrganizations(data.organizations)
      }
    } catch (error) {
      console.error("Error fetching organizations:", error)
    } finally {
      setIsLoadingOrgs(false)
    }
  }

  const handleSwitchOrganization = async (organizationId: string) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/organizations/switch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({ organizationId }),
      })

      const data = await response.json()

      if (data.success) {
        // Close the modal first
        setIsSettingsOpen(false)

        // Update local storage with new organization info
        const storedUser = localStorage.getItem("user")
        if (storedUser) {
          const userData = JSON.parse(storedUser)
          userData.organizationId = data.organization.id
          userData.role = data.role
          localStorage.setItem("user", JSON.stringify(userData))
        }

        // Refresh user context first (this will trigger org context to refresh via useEffect)
        await refreshUser()

        // Force a full page reload to ensure all data is fresh
        window.location.reload()
      } else {
        alert(data.error || "Failed to switch organization")
      }
    } catch (error) {
      console.error("Error switching organization:", error)
      alert("Failed to switch organization")
    }
  }

  useEffect(() => {
    if (isSettingsOpen) {
      fetchUserOrganizations()
    }
  }, [isSettingsOpen])

  if (isLoading) {
    return (
      <div className="px-3 py-2">
        <Skeleton className="h-14 w-full bg-sidebar-accent/20" />
      </div>
    )
  }

  // If no organization, show options to create or join
  if (!currentOrganization) {
    return (
      <div className="px-3 py-2 space-y-2">
        <Button onClick={handleCreateOrganization} className="w-full justify-start gap-2" variant="outline">
          <Plus className="w-4 h-4" />
          Create Organization
        </Button>
        <Button onClick={handleJoinOrganization} className="w-full justify-start gap-2" variant="outline">
          <UserPlus className="w-4 h-4" />
          Join Organization
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="px-3 py-2 space-y-2">
        <div className="bg-sidebar-accent/20 rounded-lg p-3 border border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sidebar-primary flex items-center justify-center text-sm font-bold text-sidebar-primary-foreground shrink-0">
              {currentOrganization.logo}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-sidebar-foreground truncate">
                {currentOrganization.name}
              </p>
              <p className="text-xs text-sidebar-foreground/60">
                IC: {currentOrganization.inviteCode}{" "}
                {/* <button
                  onClick={handleCopyInviteCode}
                  className="ml-1 p-1 rounded-md hover:bg-sidebar-accent/40 transition-colors"
                  title="Copy invite code"
                >
                  {copied ? (
                    <Check className="w-3 h-3 text-green-600" />
                  ) : (
                    <Copy className="w-3 h-3 text-sidebar-foreground/60" />
                  )}
                </button> */}
              </p>
            </div>
            <Button
              onClick={() => setIsSettingsOpen(true)}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-sidebar-accent/40"
              title="Organization settings"
            >
              <Settings className="w-4 h-4 text-sidebar-foreground/60" />
            </Button>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Organization Settings</DialogTitle>
            <DialogDescription>Manage your organizations and switch between them</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Current Organization */}
            <div>
              <h3 className="text-sm font-semibold mb-2">Current Organization</h3>
              <div className="flex items-center gap-3 p-3 bg-primary/10 border border-primary/30 rounded-lg">
                <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-sm font-bold text-primary-foreground shrink-0">
                  {currentOrganization.logo}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{currentOrganization.name}</p>
                  <p className="text-xs text-muted-foreground">Code: {currentOrganization.inviteCode}</p>
                </div>
                <Check className="w-5 h-5 text-primary" />
              </div>
            </div>

            {/* My Organizations */}
            <div>
              <h3 className="text-sm font-semibold mb-2">My Organizations</h3>
              {isLoadingOrgs ? (
                <div className="text-sm text-muted-foreground text-center py-4">Loading...</div>
              ) : userOrganizations.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {userOrganizations
                    .filter((org) => org.id !== currentOrganization.id)
                    .map((org) => (
                      <button
                        key={org.id}
                        onClick={() => handleSwitchOrganization(org.id)}
                        className="w-full flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-sm font-bold shrink-0">
                          {org.logo}
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-sm font-medium truncate">{org.name}</p>
                          <p className="text-xs text-muted-foreground">Code: {org.inviteCode}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </button>
                    ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground text-center py-4">
                  You are only in one organization
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2 border-t">
              <Button onClick={handleJoinOrganization} className="w-full justify-start gap-2" variant="outline">
                <UserPlus className="w-4 h-4" />
                Join Another Organization
              </Button>
              <Button onClick={handleCreateOrganization} className="w-full justify-start gap-2" variant="outline">
                <Plus className="w-4 h-4" />
                Create New Organization
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Join Organization Modal */}
      <Dialog open={isJoinModalOpen} onOpenChange={setIsJoinModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Join Organization</DialogTitle>
            <DialogDescription>Enter the invite code to join an organization</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label htmlFor="invite-code" className="text-sm font-medium mb-2 block">
                Invite Code
              </label>
              <Input
                id="invite-code"
                placeholder="Enter invite code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                className="w-full"
                disabled={isJoining}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setIsJoinModalOpen(false)
                  setJoinCode("")
                }}
                variant="outline"
                className="flex-1"
                disabled={isJoining}
              >
                Cancel
              </Button>
              <Button onClick={handleJoinWithCode} className="flex-1" disabled={isJoining || !joinCode.trim()}>
                {isJoining ? "Joining..." : "Join Organization"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Organization Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Organization</DialogTitle>
            <DialogDescription>Enter your organization name. The handle will be generated automatically.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label htmlFor="org-name" className="text-sm font-medium mb-2 block">
                Organization Name
              </label>
              <Input
                id="org-name"
                placeholder="e.g., Acme Corporation"
                value={orgName}
                onChange={(e) => handleOrgNameChange(e.target.value)}
                className="w-full"
                disabled={isCreating}
              />
            </div>

            <div>
              <label htmlFor="org-handle" className="text-sm font-medium mb-2 block">
                Handle
              </label>
              <Input
                id="org-handle"
                placeholder="e.g., acme-corporation"
                value={orgHandle}
                onChange={(e) => setOrgHandle(e.target.value)}
                className="w-full"
                disabled={isCreating}
              />
              <p className="text-xs text-muted-foreground mt-1">
                This will be your organization&apos;s unique identifier
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setIsCreateModalOpen(false)
                  setOrgName("")
                  setOrgHandle("")
                }}
                variant="outline"
                className="flex-1"
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateWithName} className="flex-1" disabled={isCreating || !orgName.trim()}>
                {isCreating ? "Creating..." : "Create Organization"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
