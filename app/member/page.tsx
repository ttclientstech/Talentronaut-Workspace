"use client"

import { useState } from "react"
import MemberMyTasksView from "@/components/member-my-tasks-view"
import MemberProjectsView from "@/components/member-projects-view"
import MyScheduleView from "@/components/my-schedule-view"
import SkillsView from "@/components/skills-view"
import ProtectedRoute from "@/components/protected-route"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import PasswordsView from "@/components/passwords-view"
import { UserSettingsDialog } from "@/components/user-settings-dialog"

export default function MemberPage() {
  return (
    <ProtectedRoute allowedRoles={["Member"]} requireOrganization={false}>
      <MemberPageContent />
    </ProtectedRoute>
  )
}

function MemberPageContent() {
  const { user, logout } = useAuth()
  const [currentView, setCurrentView] = useState<"my-tasks" | "projects" | "my-schedule" | "my-skills" | "passwords">("my-tasks")

  const handleViewChange = (view: "my-tasks" | "projects" | "my-schedule" | "my-skills" | "passwords") => {
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
          <p className="text-xs text-white/60 font-medium tracking-[0.2em] uppercase ml-1">Member Workspace</p>
        </div>

        <div className="flex-1 px-4 space-y-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:none]">
          <div className="mb-2 px-4 py-2">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest font-mono">Work</p>
          </div>
          <button
            onClick={() => handleViewChange("my-tasks")}
            className={`w-full text-left px-5 py-3.5 rounded-full transition-all duration-300 font-medium text-sm flex items-center gap-3 group relative overflow-hidden ${currentView === "my-tasks"
              ? "bg-white text-[#D4503A] shadow-lg shadow-black/10 font-bold translate-x-1"
              : "text-white/80 hover:bg-white/10 hover:text-white hover:translate-x-1"
              }`}
          >
            My Tasks
          </button>
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
            onClick={() => handleViewChange("passwords")}
            className={`w-full text-left px-5 py-3.5 rounded-full transition-all duration-300 font-medium text-sm flex items-center gap-3 group ${currentView === "passwords"
              ? "bg-white text-[#D4503A] shadow-lg shadow-black/10 font-bold translate-x-1"
              : "text-white/80 hover:bg-white/10 hover:text-white hover:translate-x-1"
              }`}
          >
            Passwords
          </button>

          <div className="mt-6 mb-2 px-4 py-2">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest font-mono">Personal</p>
          </div>
          <button
            onClick={() => handleViewChange("my-schedule")}
            className={`w-full text-left px-5 py-3.5 rounded-full transition-all duration-300 font-medium text-sm flex items-center gap-3 group ${currentView === "my-schedule"
              ? "bg-white text-[#D4503A] shadow-lg shadow-black/10 font-bold translate-x-1"
              : "text-white/80 hover:bg-white/10 hover:text-white hover:translate-x-1"
              }`}
          >
            My Schedule
          </button>
          <button
            onClick={() => handleViewChange("my-skills")}
            className={`w-full text-left px-5 py-3.5 rounded-full transition-all duration-300 font-medium text-sm flex items-center gap-3 group ${currentView === "my-skills"
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
              {user?.name?.charAt(0).toUpperCase() || "M"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white text-sm truncate">{user?.name || "Member"}</p>
              <p className="text-[11px] text-white/60 font-medium truncate uppercase tracking-wide">{user?.role || "Member"}</p>
            </div>
            <UserSettingsDialog />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {currentView === "my-tasks" && <MemberMyTasksView />}
        {currentView === "projects" && <MemberProjectsView />}
        {currentView === "my-schedule" && <MyScheduleView />}
        {currentView === "my-skills" && <SkillsView />}
        {currentView === "passwords" && <PasswordsView />}
      </main>
    </div>
  )
}
