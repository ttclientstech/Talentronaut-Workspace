"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useRouter } from "next/navigation"

interface User {
  id: string
  name: string
  email: string
  role: "Admin" | "Lead" | "Member"
  profilePicture?: string
  projectId?: string
  isGuest?: boolean
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  loginWithAccessCode: (accessCode: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Check if user is authenticated on mount
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async (showLoading = true) => {
    try {
      if (showLoading) {
        setIsLoading(true)
      }

      // Always fetch fresh data from API if we have a token
      const storedToken = localStorage.getItem("token")

      if (storedToken) {
        // Fetch fresh user data from API
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.user) {
            const userData = {
              id: data.user.id,
              name: data.user.name,
              email: data.user.email,
              role: data.user.role,
              profilePicture: data.user.profilePicture,
              projectId: data.user.projectId,
              isGuest: data.user.isGuest,
            }
            setUser(userData)
            localStorage.setItem("user", JSON.stringify(userData))
          } else {
            setUser(null)
            localStorage.removeItem("user")
            localStorage.removeItem("token")
          }
        } else {
          setUser(null)
          // Clear localStorage if API check fails
          localStorage.removeItem("user")
          localStorage.removeItem("token")
        }
      } else {
        // No token - clear everything
        setUser(null)
        localStorage.removeItem("user")
      }
    } catch (error) {
      console.error("Auth check failed:", error)
      setUser(null)
    } finally {
      if (showLoading) {
        setIsLoading(false)
      }
    }
  }

  const loginWithAccessCode = async (accessCode: string) => {
    try {
      // Try project access token first (for guest/invited users)
      const projectTokenResponse = await fetch("/api/auth/login-with-project-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ accessCode }),
      })

      if (projectTokenResponse.ok) {
        const data = await projectTokenResponse.json()

        if (data.success && data.user) {
          const userData = {
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            role: data.user.role,
            profilePicture: data.user.profilePicture,
            projectId: data.user.projectId,
            isGuest: data.user.isGuest,
          }
          setUser(userData)
          localStorage.setItem("user", JSON.stringify(userData))
          localStorage.setItem("token", data.token)

          // Redirect to specific project if provided
          if (data.redirectTo) {
            window.location.href = data.redirectTo
          }
          return
        }
      }

      // If project token fails, try regular user access code
      const userCodeResponse = await fetch("/api/auth/login-with-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ accessCode }),
      })

      const userDataResponse = await userCodeResponse.json()

      if (!userCodeResponse.ok) {
        throw new Error(userDataResponse.error || "Login failed")
      }

      if (userDataResponse.success && userDataResponse.user) {
        const user = {
          id: userDataResponse.user.id,
          name: userDataResponse.user.name,
          email: userDataResponse.user.email,
          role: userDataResponse.user.role,
          profilePicture: userDataResponse.user.profilePicture,
          projectId: userDataResponse.user.projectId,
        }
        setUser(user)
        localStorage.setItem("user", JSON.stringify(user))
        localStorage.setItem("token", userDataResponse.token)
      }
    } catch (error) {
      console.error("Login with code error:", error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      })
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      setUser(null)
      localStorage.clear() // Clear all
      router.push("/login")
    }
  }

  const refreshUser = async () => {
    await checkAuth(false)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        loginWithAccessCode,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
