"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { AlertCircle, KeyRound, ArrowRight, Sparkles } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const { user, isLoading: authLoading, isAuthenticated, loginWithAccessCode } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [accessCode, setAccessCode] = useState("")
  const [activeInput, setActiveInput] = useState(false)

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      // Redirect based on role
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
          router.push("/dashboard")
      }
    }
  }, [authLoading, isAuthenticated, user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      if (!accessCode.trim()) {
        throw new Error("Access code is required")
      }

      await loginWithAccessCode(accessCode)
      router.push("/")
    } catch (err: any) {
      setError(err.message || "Invalid access code. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground font-brand">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render login form if already authenticated
  if (isAuthenticated && user) {
    return null
  }

  return (
    <div className="min-h-screen w-full flex overflow-hidden bg-background">
      {/* Brand Section (Left Side) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-primary items-center justify-center overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full bg-accent blur-[150px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-secondary blur-[100px]" />
        </div>

        <div className="relative z-10 p-12 text-primary-foreground max-w-xl text-center md:text-left">
          <div className="mb-8 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-foreground/10 border border-primary-foreground/20 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium tracking-wide">AI-POWERED WORK MANAGEMENT</span>
          </div>

          <h1 className="font-brand text-6xl md:text-7xl font-bold mb-6 leading-tight">
            Work smarter, <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-accent to-secondary">not harder.</span>
          </h1>

          <p className="text-lg text-primary-foreground/70 leading-relaxed max-w-md">
            Experience the future of project management with our award-winning AI platform. Streamline your workflow, empower your team, and achieve more.
          </p>

          <div className="mt-12 flex items-center gap-4 text-sm text-primary-foreground/50">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-primary-foreground/20 border border-primary ring-2 ring-primary flex items-center justify-center text-xs">
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
            </div>
            <p>Trusted by 10,000+ teams worldwide</p>
          </div>
        </div>
      </div>

      {/* Login Form Section (Right Side) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12 relative">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="font-brand text-4xl font-semibold text-foreground mb-2">Welcome Back</h2>
            <p className="text-muted-foreground">Please enter your access code to continue.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="accessCode" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold ml-1">Access Code</Label>
              <div className={`relative transition-all duration-300 ${activeInput ? "scale-[1.02]" : "scale-100"}`}>
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <KeyRound className={`h-5 w-5 transition-colors ${activeInput ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <Input
                  id="accessCode"
                  type="text"
                  placeholder="Enter Code"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  onFocus={() => setActiveInput(true)}
                  onBlur={() => setActiveInput(false)}
                  required
                  disabled={isLoading}
                  className="h-14 pl-12 text-lg tracking-widest font-mono border-2 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all uppercase"
                  autoComplete="off"
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-xl flex items-center gap-3 animate-fade-in">
                <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
                <p className="text-sm text-destructive font-medium">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 rounded-xl text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-300"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  <span>Verifying...</span>
                </div>
              ) : (
                <span className="flex items-center gap-2">
                  Access Dashboard <ArrowRight className="w-4 h-4 ml-1" />
                </span>
              )}
            </Button>
          </form>

          <div className="pt-6 text-center">
            <p className="text-xs text-muted-foreground">
              Don't have an access code? <a href="#" className="font-medium text-primary hover:underline">Contact Support</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
