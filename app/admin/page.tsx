"use client"

import { useState, useEffect } from "react"
import Dashboard from "@/components/dashboard"
import ProjectsView from "@/components/projects-view"
import AdminTasksView from "@/components/admin-tasks-view"
import MembersView from "@/components/members-view"

import MyTasksView from "@/components/my-tasks-view"
import MyScheduleView from "@/components/my-schedule-view"
import SkillsView from "@/components/skills-view"
import CreateProjectModal from "@/components/create-project-modal"
import AdminAITaskAssignerSleek from "@/components/admin-ai-task-assigner-sleek"
import TeamSettingsModal from "@/components/team-settings-modal"
import ManageProjectTeamModal from "@/components/manage-project-team-modal"
import FloatingAITaskAssigner from "@/components/floating-ai-task-assigner"
import ProtectedRoute from "@/components/protected-route"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import AdminUsersView from "@/components/admin-users-view"

export default function AdminPage() {
  return (
    <ProtectedRoute allowedRoles={["Admin"]} requireOrganization={false}>
      <AdminPageContent />
    </ProtectedRoute>
  )
}

function AdminPageContent() {
  const { user, logout } = useAuth()
  const [currentView, setCurrentView] = useState<
    "dashboard" | "projects" | "tasks" | "members" | "my-tasks" | "schedule" | "skills" | "users"
  >("dashboard")
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false)
  const [isAITaskAssignerOpen, setIsAITaskAssignerOpen] = useState(false)
  const [isTeamSettingsOpen, setIsTeamSettingsOpen] = useState(false)
  const [isManageTeamOpen, setIsManageTeamOpen] = useState(false)

  const handleProjectSelect = (projectId: string) => {
    setSelectedProject(projectId)
    setCurrentView("tasks")
  }

  const handleViewChange = (
    view: "dashboard" | "projects" | "tasks" | "members" | "my-tasks" | "schedule" | "skills" | "users",
  ) => {
    setCurrentView(view)
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar Navigation */}
      <nav className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
        <div className="p-4 border-b border-sidebar-border">
          <div className="font-semibold text-lg text-sidebar-foreground truncate">
            Talentronaut
          </div>
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
            onClick={() => handleViewChange("users")}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${currentView === "users"
              ? "bg-sidebar-primary text-sidebar-primary-foreground"
              : "text-sidebar-foreground hover:bg-sidebar-accent/20"
              }`}
          >
            User Management
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
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center justify-between gap-2 ${currentView === "members"
              ? "bg-sidebar-primary text-sidebar-primary-foreground"
              : "text-sidebar-foreground hover:bg-sidebar-accent/20"
              }`}
          >
            <span>Members</span>
          </button>
          <button
            onClick={() => handleViewChange("schedule")}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${currentView === "schedule"
              ? "bg-sidebar-primary text-sidebar-primary-foreground"
              : "text-sidebar-foreground hover:bg-sidebar-accent/20"
              }`}
          >
            My Schedule
          </button>
          <button
            onClick={() => handleViewChange("skills")}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${currentView === "skills"
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
              {user?.name?.charAt(0).toUpperCase() || "A"}
            </div>
            <div className="flex-1 text-sm min-w-0">
              <p className="font-medium text-sidebar-foreground truncate">{user?.role || "Admin"}</p>
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
          <Dashboard
            onViewChange={handleViewChange}
            onOpenCreateProject={() => setIsCreateProjectOpen(true)}
            onOpenAITaskAssigner={() => setIsAITaskAssignerOpen(true)}
            onOpenTeamSettings={() => setIsTeamSettingsOpen(true)}
          />
        )}
        {currentView === "users" && <AdminUsersView />}
        {currentView === "my-tasks" && <MyTasksView />}
        {currentView === "schedule" && <MyScheduleView />}
        {currentView === "skills" && <SkillsView />}
        {currentView === "projects" && <ProjectsView onProjectSelect={handleProjectSelect} />}
        {currentView === "tasks" && selectedProject && (
          <AdminTasksView projectId={selectedProject} onOpenManageTeam={() => setIsManageTeamOpen(true)} />
        )}
        {currentView === "members" && <MembersView onViewChange={handleViewChange} />}
      </main>

      {/* Modals */}
      <CreateProjectModal isOpen={isCreateProjectOpen} onClose={() => setIsCreateProjectOpen(false)} />
      <AdminAITaskAssignerSleek isOpen={isAITaskAssignerOpen} onClose={() => setIsAITaskAssignerOpen(false)} />
      <TeamSettingsModal isOpen={isTeamSettingsOpen} onClose={() => setIsTeamSettingsOpen(false)} />
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
