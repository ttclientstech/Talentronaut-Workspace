"use client"

import { useState } from "react"
import { Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import AdminAITaskAssignerSleek from "@/components/admin-ai-task-assigner-sleek"
import LeadAITaskAssigner from "@/components/lead-ai-task-assigner"
import { useAuth } from "@/lib/auth-context"

export default function FloatingAITaskAssigner() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { user } = useAuth()

  // Don't render if user data is not loaded yet
  if (!user) return null

  // Get current user role from auth context
  const currentUserRole = user.role

  // Only show for Admin and Lead roles
  const canAccessAITaskAssigner = currentUserRole === "Admin" || currentUserRole === "Lead"

  if (!canAccessAITaskAssigner) return null

  return (
    <>
      <Button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-6 right-6 rounded-full shadow-lg z-50 h-14 px-6 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground transition-all hover:scale-105"
      >
        <Zap className="w-5 h-5" />
        <span className="font-medium">AI Task Assigner</span>
      </Button>

      {/* Admin delegates to Leads, Lead assigns to Members */}
      {currentUserRole === "Admin" ? (
        <AdminAITaskAssignerSleek isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      ) : (
        <LeadAITaskAssigner isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      )}
    </>
  )
}
