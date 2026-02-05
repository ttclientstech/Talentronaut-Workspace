"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import ProtectedRoute from "@/components/protected-route"
import ProjectTrackerView from "@/components/project-tracker-view"

export default function GuestPage() {
    return (
        <ProtectedRoute allowedRoles={["Member"]} requireOrganization={false}>
            <GuestPageContent />
        </ProtectedRoute>
    )
}

function GuestPageContent() {
    const { user, logout } = useAuth()
    const [projectId, setProjectId] = useState<string | null>(null)

    useEffect(() => {
        if (user?.projectId) {
            setProjectId(user.projectId)
        }
    }, [user])

    const handleBack = () => {
        // For guest users, "back" means logout
        logout()
    }

    if (!projectId) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading project...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex h-screen bg-background">
            {/* Simplified Sidebar for Guests */}
            <nav className="w-72 bg-[#D4503A] border-r border-white/10 flex flex-col shadow-2xl relative z-20 text-white font-sans">
                <div className="p-8 pb-6">
                    <div className="font-brand text-3xl font-bold text-white tracking-wide flex items-center gap-2 mb-1">
                        Talentronaut
                    </div>
                    <p className="text-xs text-white/60 font-medium tracking-[0.2em] uppercase ml-1">Guest Workspace</p>
                </div>

                <div className="flex-1 px-4 space-y-1 overflow-y-auto">
                    <div className="mb-2 px-4 py-2">
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest font-mono">Project</p>
                    </div>
                    <button
                        className="w-full text-left px-5 py-3.5 rounded-full transition-all duration-300 font-medium text-sm flex items-center gap-3 bg-white text-[#D4503A] shadow-lg shadow-black/10 font-bold translate-x-1"
                    >
                        Tracker
                    </button>
                </div>

                {/* Logout Section */}
                <div className="mt-auto p-6 border-t border-white/10">
                    <div className="flex items-center gap-4 p-3 rounded-2xl bg-black/10 border border-white/5 backdrop-blur-sm mb-4">
                        <div className="w-10 h-10 rounded-full bg-white text-[#D4503A] flex items-center justify-center text-sm font-black shadow-sm ring-2 ring-white/20">
                            {user?.name?.charAt(0).toUpperCase() || "G"}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-white text-sm truncate">{user?.name || "Guest"}</p>
                            <p className="text-[11px] text-white/60 font-medium truncate uppercase tracking-wide">Guest User</p>
                        </div>
                    </div>

                    <Button
                        onClick={logout}
                        variant="outline"
                        className="w-full bg-white/10 hover:bg-white/20 text-white border-white/20 hover:border-white/30"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                    </Button>
                </div>
            </nav>

            {/* Main Content - Project Tracker */}
            <main className="flex-1 overflow-auto">
                <ProjectTrackerView projectId={projectId} onBack={handleBack} />
            </main>
        </div>
    )
}
