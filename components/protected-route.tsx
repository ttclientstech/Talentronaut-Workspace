"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: ("Admin" | "Lead" | "Member")[]
  requireOrganization?: boolean
}

export default function ProtectedRoute({ children, allowedRoles, requireOrganization = false }: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      // Not authenticated - redirect to login
      if (!isAuthenticated || !user) {
        router.push("/login")
        return
      }

      // Check if user role is allowed
      if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Redirect based on actual role

        if (user.role === "Admin") {
          router.push("/admin")
        } else if (user.role === "Lead") {
          router.push("/lead")
        } else {
          router.push("/member")
        }
        return
      }

      // Check if organization is required
      // Organization check removed
      /* if (requireOrganization && !user.organizationId) {
        router.push("/welcome")
        return
      } */
    }
  }, [isLoading, isAuthenticated, user, user?.role, allowedRoles, requireOrganization, router])

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Not authenticated
  if (!isAuthenticated || !user) {
    return null
  }

  // Role not allowed
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return null
  }

  // Organization required but not present
  // Organization required check removed
  /* if (requireOrganization && !user.organizationId) {
    return null
  } */

  // All checks passed - render children
  return <>{children}</>
}
