"use client"

import { useState, useEffect } from "react"
import Dashboard from "@/components/dashboard"
import ProjectsView from "@/components/projects-view"
import AdminTasksView from "@/components/admin-tasks-view"
import TeamsView from "@/components/teams-view"

import MyTasksView from "@/components/my-tasks-view"
import MyScheduleView from "@/components/my-schedule-view"
import SkillsView from "@/components/skills-view"
import CreateProjectModal from "@/components/create-project-modal"
import AdminAITaskAssignerSleek from "@/components/admin-ai-task-assigner-sleek"
import TeamSettingsModal from "@/components/team-settings-modal"
import ManageProjectTeamModal from "@/components/manage-project-team-modal"
import FloatingAITaskAssigner from "@/components/floating-ai-task-assigner"
import ProtectedRoute from "@/components/protected-route"
import ProjectTrackerView from "@/components/project-tracker-view"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import AdminUsersView from "@/components/admin-users-view"
import PasswordsView from "@/components/passwords-view"
import { UserSettingsDialog } from "@/components/user-settings-dialog"

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
    "dashboard" | "projects" | "tasks" | "members" | "my-tasks" | "schedule" | "skills" | "users" | "passwords" | "project-tracker"
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

  const handleOpenProjectTracker = (projectId: string) => {
    setSelectedProject(projectId)
    setCurrentView("project-tracker")
  }

  const handleViewChange = (
    view: "dashboard" | "projects" | "tasks" | "members" | "my-tasks" | "schedule" | "skills" | "users" | "passwords" | "project-tracker",
  ) => {
    setCurrentView(view)
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar Navigation */}
      <nav className="w-72 bg-[#D4503A] border-r border-white/10 flex flex-col shadow-2xl relative z-20 text-white font-sans">
        <div className="p-8 pb-6">
          <div className="font-brand text-3xl font-bold text-white tracking-wide flex items-center gap-2 mb-1">
            Talentronaut
          </div>
          <p className="text-xs text-white/60 font-medium tracking-[0.2em] uppercase ml-1">Workspace</p>
        </div>

        <div className="flex-1 px-4 space-y-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:none]">
          <div className="mb-2 px-4 py-2">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest font-mono">Main</p>
          </div>
          <button
            onClick={() => handleViewChange("dashboard")}
            className={`w-full text-left px-5 py-3.5 rounded-full transition-all duration-300 font-medium text-sm flex items-center gap-3 group relative overflow-hidden ${currentView === "dashboard"
              ? "bg-white text-[#D4503A] shadow-lg shadow-black/10 font-bold translate-x-1"
              : "text-white/80 hover:bg-white/10 hover:text-white hover:translate-x-1"
              }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => handleViewChange("passwords")}
            className={`w-full text-left px-5 py-3.5 rounded-full transition-all duration-300 font-medium text-sm flex items-center gap-3 group relative overflow-hidden ${currentView === "passwords"
              ? "bg-white text-[#D4503A] shadow-lg shadow-black/10 font-bold translate-x-1"
              : "text-white/80 hover:bg-white/10 hover:text-white hover:translate-x-1"
              }`}
          >
            Passwords
          </button>

          <div className="mt-6 mb-2 px-4 py-2">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest font-mono">Team</p>
          </div>
          <button
            onClick={() => handleViewChange("members")}
            className={`w-full text-left px-5 py-3.5 rounded-full transition-all duration-300 font-medium text-sm flex items-center gap-3 group ${currentView === "members"
              ? "bg-white text-[#D4503A] shadow-lg shadow-black/10 font-bold translate-x-1"
              : "text-white/80 hover:bg-white/10 hover:text-white hover:translate-x-1"
              }`}
          >
            Teams
          </button>
          <button
            onClick={() => handleViewChange("users")}
            className={`w-full text-left px-5 py-3.5 rounded-full transition-all duration-300 font-medium text-sm flex items-center gap-3 group ${currentView === "users"
              ? "bg-white text-[#D4503A] shadow-lg shadow-black/10 font-bold translate-x-1"
              : "text-white/80 hover:bg-white/10 hover:text-white hover:translate-x-1"
              }`}
          >
            User Management
          </button>

          <div className="mt-6 mb-2 px-4 py-2">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest font-mono">Work</p>
          </div>
          <button
            onClick={() => handleViewChange("projects")}
            className={`w-full text-left px-5 py-3.5 rounded-full transition-all duration-300 font-medium text-sm flex items-center gap-3 group ${currentView === "projects"
              ? "bg-white text-[#D4503A] shadow-lg shadow-black/10 font-bold translate-x-1"
              : "text-white/80 hover:bg-white/10 hover:text-white hover:translate-x-1"
              }`}
          >
            Projects
          </button>
          <button
            onClick={() => handleViewChange("my-tasks")}
            className={`w-full text-left px-5 py-3.5 rounded-full transition-all duration-300 font-medium text-sm flex items-center gap-3 group ${currentView === "my-tasks"
              ? "bg-white text-[#D4503A] shadow-lg shadow-black/10 font-bold translate-x-1"
              : "text-white/80 hover:bg-white/10 hover:text-white hover:translate-x-1"
              }`}
          >
            My Tasks
          </button>
          <button
            onClick={() => handleViewChange("schedule")}
            className={`w-full text-left px-5 py-3.5 rounded-full transition-all duration-300 font-medium text-sm flex items-center gap-3 group ${currentView === "schedule"
              ? "bg-white text-[#D4503A] shadow-lg shadow-black/10 font-bold translate-x-1"
              : "text-white/80 hover:bg-white/10 hover:text-white hover:translate-x-1"
              }`}
          >
            My Schedule
          </button>
          <button
            onClick={() => handleViewChange("skills")}
            className={`w-full text-left px-5 py-3.5 rounded-full transition-all duration-300 font-medium text-sm flex items-center gap-3 group ${currentView === "skills"
              ? "bg-white text-[#D4503A] shadow-lg shadow-black/10 font-bold translate-x-1"
              : "text-white/80 hover:bg-white/10 hover:text-white hover:translate-x-1"
              }`}
          >
            My Skills
          </button>
        </div>

        <div className="mt-auto p-6 border-t border-white/10">
          <div className="flex items-center gap-4 p-3 rounded-2xl bg-black/10 border border-white/5 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-full bg-white text-[#D4503A] flex items-center justify-center text-sm font-black shadow-sm ring-2 ring-white/20">
              {user?.name?.charAt(0).toUpperCase() || "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white text-sm truncate">{user?.name || "User"}</p>
              <p className="text-[11px] text-white/60 font-medium truncate uppercase tracking-wide">{user?.role || "Admin"}</p>
            </div>
            <UserSettingsDialog />
          </div>
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
            onNavigateToProject={handleProjectSelect}
          />
        )}
        {currentView === "users" && <AdminUsersView />}
        {currentView === "my-tasks" && <MyTasksView />}
        {currentView === "schedule" && <MyScheduleView />}
        {currentView === "skills" && <SkillsView />}
        {currentView === "projects" && (
          <ProjectsView
            onProjectSelect={handleProjectSelect}
            onOpenProjectTracker={handleOpenProjectTracker}
          />
        )}
        {currentView === "tasks" && selectedProject && (
          <AdminTasksView
            projectId={selectedProject}
            onOpenManageTeam={() => setIsManageTeamOpen(true)}
            onBack={() => setCurrentView("projects")}
          />
        )}
        {currentView === "project-tracker" && selectedProject && (
          <ProjectTrackerView
            projectId={selectedProject}
            onBack={() => setCurrentView("projects")}
          />
        )}
        {currentView === "members" && <TeamsView onViewChange={handleViewChange} />}
        {currentView === "passwords" && <PasswordsView />}
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
