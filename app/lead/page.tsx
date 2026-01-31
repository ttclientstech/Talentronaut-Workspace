"use client"

import { useState } from "react"
import LeadDashboard from "@/components/lead-dashboard"
import LeadProjectsView from "@/components/lead-projects-view"
import AdminTasksView from "@/components/admin-tasks-view"
import LeadMembersView from "@/components/lead-members-view"
import LeadMyTasksView from "@/components/lead-my-tasks-view"
import MyScheduleView from "@/components/my-schedule-view"
import SkillsView from "@/components/skills-view"
import LeadAITaskAssigner from "@/components/lead-ai-task-assigner"
import ManageProjectTeamModal from "@/components/manage-project-team-modal"
import FloatingAITaskAssigner from "@/components/floating-ai-task-assigner"
import ProtectedRoute from "@/components/protected-route"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

export default function LeadPage() {
  return (
    <ProtectedRoute allowedRoles={["Lead"]} requireOrganization={false}>
      <LeadPageContent />
    </ProtectedRoute>
  )
}

function LeadPageContent() {
  const { user, logout } = useAuth()
  const [currentView, setCurrentView] = useState<
    "dashboard" | "projects" | "tasks" | "members" | "my-tasks" | "my-schedule" | "my-skills"
  >("dashboard")
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [isAITaskAssignerOpen, setIsAITaskAssignerOpen] = useState(false)
  const [isManageTeamOpen, setIsManageTeamOpen] = useState(false)

  const handleProjectSelect = (projectId: string) => {
    setSelectedProject(projectId)
    setCurrentView("tasks")
  }

  const handleViewChange = (
    view: "dashboard" | "projects" | "tasks" | "members" | "my-tasks" | "my-schedule" | "my-skills",
  ) => {
    setCurrentView(view)
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar Navigation */}
      <nav className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
        <div className="p-2 border-b border-sidebar-border">
          {/* Organization Switcher Removed */}
        </div>

        <div className="flex-1 p-4 space-y-2">
          <button
            onClick={() => handleViewChange("dashboard")}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${currentView === "dashboard"
              ? "bg-sidebar-primary text-sidebar-primary-foreground"
              : "text-sidebar-foreground hover:bg-sidebar-accent/20"
              }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => handleViewChange("my-tasks")}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${currentView === "my-tasks"
              ? "bg-sidebar-primary text-sidebar-primary-foreground"
              : "text-sidebar-foreground hover:bg-sidebar-accent/20"
              }`}
          >
            My Tasks
          </button>
          <button
            onClick={() => handleViewChange("projects")}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${currentView === "projects"
              ? "bg-sidebar-primary text-sidebar-primary-foreground"
              : "text-sidebar-foreground hover:bg-sidebar-accent/20"
              }`}
          >
            Projects
          </button>
          <button
            onClick={() => handleViewChange("members")}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-2 ${currentView === "members"
              ? "bg-sidebar-primary text-sidebar-primary-foreground"
              : "text-sidebar-foreground hover:bg-sidebar-accent/20"
              }`}
          >
            Members
          </button>
          <button
            onClick={() => handleViewChange("my-schedule")}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${currentView === "my-schedule"
              ? "bg-sidebar-primary text-sidebar-primary-foreground"
              : "text-sidebar-foreground hover:bg-sidebar-accent/20"
              }`}
          >
            My Schedule
          </button>
          <button
            onClick={() => handleViewChange("my-skills")}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${currentView === "my-skills"
              ? "bg-sidebar-primary text-sidebar-primary-foreground"
              : "text-sidebar-foreground hover:bg-sidebar-accent/20"
              }`}
          >
            My Skills
          </button>
        </div>

        <div className="mt-auto p-4 border-t border-sidebar-border space-y-2">
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-sidebar-accent/20">
            <div className="w-8 h-8 rounded-full bg-sidebar-primary flex items-center justify-center text-xs font-bold text-sidebar-primary-foreground">
              {user?.name?.charAt(0).toUpperCase() || "L"}
            </div>
            <div className="flex-1 text-sm min-w-0">
              <p className="font-medium text-sidebar-foreground truncate">{user?.role || "Lead"}</p>
              <p className="text-xs text-sidebar-foreground/60 truncate">{user?.email || "user@example.com"}</p>
            </div>
          </div>
          <Button
            onClick={logout}
            variant="ghost"
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent/20 hover:text-sidebar-foreground"
            size="sm"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {currentView === "dashboard" && (
          <LeadDashboard
            onViewChange={handleViewChange}
            onOpenAITaskAssigner={() => setIsAITaskAssignerOpen(true)}
            onOpenManageTeam={() => setIsManageTeamOpen(true)}
          />
        )}
        {currentView === "my-tasks" && <LeadMyTasksView />}
        {currentView === "projects" && <LeadProjectsView onProjectSelect={handleProjectSelect} />}
        {currentView === "tasks" && selectedProject && (
          <AdminTasksView projectId={selectedProject} onOpenManageTeam={() => setIsManageTeamOpen(true)} />
        )}
        {currentView === "members" && <LeadMembersView onViewChange={handleViewChange} />}
        {currentView === "my-schedule" && <MyScheduleView />}
        {currentView === "my-skills" && <SkillsView />}
      </main>

      {/* AI Task Assigner Modal */}
      <LeadAITaskAssigner isOpen={isAITaskAssignerOpen} onClose={() => setIsAITaskAssignerOpen(false)} />

      {/* Manage Project Team Modal */}
      <ManageProjectTeamModal
        isOpen={isManageTeamOpen}
        onClose={() => setIsManageTeamOpen(false)}
        projectId={selectedProject}
        onTeamUpdate={() => {
          // Optionally refresh project details if needed
        }}
      />

      {/* Floating AI Task Assigner Button */}
      <FloatingAITaskAssigner />
    </div>
  )
}
