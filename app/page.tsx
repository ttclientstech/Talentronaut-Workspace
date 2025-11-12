"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

export default function Home() {
  const router = useRouter()
  const { user, isLoading, isAuthenticated } = useAuth()

  useEffect(() => {
    if (!isLoading) {
      // Not authenticated - redirect to login
      if (!isAuthenticated || !user) {
        router.push("/login")
        return
      }

      // Authenticated - check if user has organization
      if (!user.organizationId) {
        // No organization - redirect to welcome page
        router.push("/welcome")
        return
      }

      // Has organization - redirect based on role
      switch (user.role) {
        case "Admin":
          router.push("/admin")
          break
        case "Lead":
          router.push("/lead")
          break
        case "Member":
          router.push("/member")
          break
        default:
          router.push("/login")
      }
    }
  }, [isLoading, isAuthenticated, user, router])

  return (
    <div className="flex h-screen bg-background items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-4">AI powered Work Manager</h1>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}
