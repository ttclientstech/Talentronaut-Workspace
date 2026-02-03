"use client";

import { useState, useEffect } from "react";
import { ArrowRight, Users, Briefcase, CheckSquare, Zap, Plus, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth-context";

interface DashboardProps {
  onViewChange: (view: "dashboard" | "projects" | "tasks" | "members") => void;
  onOpenCreateProject?: () => void;
  onOpenAITaskAssigner?: () => void;
  onOpenTeamSettings?: () => void;
}

interface DashboardStats {
  organization: {
    id: string;
    name: string;
    handle: string;
    inviteCode: string;
    adminId: string;
  };
  statistics: {
    memberCount: number;
    projectCount: number;
    activeProjects: number;
    taskCount: number;
    pendingTasks: number;
    completedTasks: number;
    aiAssignments: number;
  };
  recentProjects: Array<{
    id: string;
    name: string;
    lead: string;
    status: string;
    progress: number;
  }>;
}

export default function Dashboard({
  onViewChange,
  onOpenCreateProject,
  onOpenAITaskAssigner,
  onOpenTeamSettings,
}: DashboardProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/organizations/stats", {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setStats(data);
          }
        }
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10">
      {/* Quick Stats - Bespoke Layout */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-brand font-bold text-foreground">Overview</h2>
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest bg-muted/50 px-3 py-1 rounded-full">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div
            onClick={() => onViewChange("projects")}
            className="group relative bg-white dark:bg-card p-6 rounded-3xl border border-border/50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
          >
            <div className="absolute top-6 right-6 p-2 bg-primary/10 rounded-2xl group-hover:bg-primary group-hover:text-white transition-colors duration-300">
              <Briefcase className="w-5 h-5 text-primary group-hover:text-white transition-colors" />
            </div>
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Projects</p>
            {isLoading ? (
              <Skeleton className="h-12 w-20 mb-1" />
            ) : (
              <div className="flex items-baseline gap-2">
                <h3 className="text-5xl font-brand font-medium text-foreground">
                  {stats?.statistics.projectCount || 0}
                </h3>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-2 font-medium">Active & Ongoing</p>
          </div>

          <div
            onClick={() => onViewChange("members")}
            className="group relative bg-white dark:bg-card p-6 rounded-3xl border border-border/50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
          >
            <div className="absolute top-6 right-6 p-2 bg-accent/10 rounded-2xl group-hover:bg-accent group-hover:text-accent-foreground transition-colors duration-300">
              <Users className="w-5 h-5 text-accent-foreground/70 group-hover:text-accent-foreground transition-colors" />
            </div>
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Team</p>
            {isLoading ? (
              <Skeleton className="h-12 w-20 mb-1" />
            ) : (
              <div className="flex items-baseline gap-2">
                <h3 className="text-5xl font-brand font-medium text-foreground">
                  {stats?.statistics.memberCount || 0}
                </h3>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-2 font-medium">Members Enrolled</p>
          </div>

          <div
            onClick={() => onViewChange("tasks")} // or "my-tasks" depending on preference, likely general tasks for admin
            className="group relative bg-white dark:bg-card p-6 rounded-3xl border border-border/50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
          >
            <div className="absolute top-6 right-6 p-2 bg-secondary/30 rounded-2xl group-hover:bg-secondary group-hover:text-secondary-foreground transition-colors duration-300">
              <CheckSquare className="w-5 h-5 text-secondary-foreground/70 group-hover:text-secondary-foreground transition-colors" />
            </div>
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Pending</p>
            {isLoading ? (
              <Skeleton className="h-12 w-20 mb-1" />
            ) : (
              <div className="flex items-baseline gap-2">
                <h3 className="text-5xl font-brand font-medium text-foreground">
                  {stats?.statistics.pendingTasks || 0}
                </h3>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-2 font-medium">Tasks Needed</p>
          </div>

          <div
            onClick={onOpenAITaskAssigner}
            className="group relative bg-white dark:bg-card p-6 rounded-3xl border border-border/50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-gradient-to-br from-white to-primary/5 dark:from-card dark:to-primary/10 cursor-pointer"
          >
            <div className="absolute top-6 right-6 p-2 bg-primary/10 rounded-2xl group-hover:bg-primary group-hover:text-white transition-colors duration-300">
              <Zap className="w-5 h-5 text-primary group-hover:text-white transition-colors" />
            </div>
            <p className="text-sm font-medium text-primary uppercase tracking-wider mb-2">AI Agents</p>
            {isLoading ? (
              <Skeleton className="h-12 w-20 mb-1" />
            ) : (
              <div className="flex items-baseline gap-2">
                <h3 className="text-5xl font-brand font-medium text-primary">
                  {stats?.statistics.aiAssignments || 0}
                </h3>
              </div>
            )}
            <p className="text-xs text-primary/70 mt-2 font-medium">Auto-Assignments</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Projects - Elegant List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-2xl font-brand font-bold text-foreground">Recent Activity</h2>
            <Button variant="ghost" className="text-primary hover:text-primary hover:bg-primary/5 -mr-4" onClick={() => onViewChange("projects")}>
              View All <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          <div className="bg-white dark:bg-card rounded-[2rem] border border-border/50 shadow-sm overflow-hidden p-2">
            {isLoading ? (
              <div className="p-8 space-y-4">
                <Skeleton className="h-20 w-full rounded-2xl" />
                <Skeleton className="h-20 w-full rounded-2xl" />
              </div>
            ) : stats?.recentProjects && stats.recentProjects.length > 0 ? (
              <div className="space-y-2">
                {stats.recentProjects.map((project, index) => (
                  <div
                    key={project.id}
                    className="group flex items-center justify-between p-6 rounded-3xl hover:bg-muted/30 transition-all duration-200 cursor-pointer border border-transparent hover:border-black/5 dark:hover:border-white/5"
                  >
                    <div className="flex items-center gap-6">
                      <div className="flex flex-col items-center justify-center w-14 h-14 rounded-2xl bg-secondary/50 text-secondary-foreground font-brand text-xl font-bold shadow-sm">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="text-lg font-bold font-brand text-foreground group-hover:text-primary transition-colors">{project.name}</h4>
                        <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary/50"></span>
                          Lead: {project.lead}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-8">
                      <div className="text-right hidden sm:block">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">Progress</span>
                        <span className="font-brand text-xl font-medium text-foreground">{project.progress}%</span>
                      </div>
                      <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all shadow-sm">
                        <ArrowUpRight className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Briefcase className="w-8 h-8 text-muted-foreground/40" />
                </div>
                <h3 className="font-brand text-2xl font-bold text-foreground mb-2">No projects yet</h3>
                <p className="text-muted-foreground mb-8 max-w-sm mx-auto">Get started by creating your first project and assigning your team.</p>
                <Button
                  size="lg"
                  className="rounded-full px-8 font-medium shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                  onClick={onOpenCreateProject}
                >
                  Create Project
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions - Grid Layout */}
        <div className="space-y-6">
          <h2 className="text-2xl font-brand font-bold text-foreground px-2">Actions</h2>
          <div className="bg-white dark:bg-card p-6 rounded-[2rem] border border-border/50 shadow-sm h-fit">
            <div className="grid grid-cols-1 gap-4">
              <button
                onClick={onOpenCreateProject}
                className="flex items-center gap-4 p-4 rounded-2xl bg-primary text-white hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-lg shadow-primary/20 group text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-lg">New Project</h4>
                  <p className="text-white/80 text-xs font-medium">Start a new initiative</p>
                </div>
              </button>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={onOpenAITaskAssigner}
                  className="flex flex-col items-center justify-center p-6 rounded-2xl bg-secondary/30 hover:bg-secondary/50 border border-transparent hover:border-secondary hover:-translate-y-1 transition-all duration-200 text-center gap-3 group"
                >
                  <div className="w-10 h-10 rounded-full bg-white dark:bg-black/10 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <Zap className="w-5 h-5 text-primary" />
                  </div>
                  <span className="font-bold text-sm text-foreground">AI Assign</span>
                </button>

                <button
                  onClick={onOpenTeamSettings}
                  className="flex flex-col items-center justify-center p-6 rounded-2xl bg-muted/30 hover:bg-muted/60 border border-transparent hover:border-black/5 hover:-translate-y-1 transition-all duration-200 text-center gap-3 group"
                >
                  <div className="w-10 h-10 rounded-full bg-white dark:bg-black/10 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <Users className="w-5 h-5 text-foreground/70" />
                  </div>
                  <span className="font-bold text-sm text-foreground">Team</span>
                </button>
              </div>

              {stats?.organization && (
                <div className="mt-4 p-6 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 space-y-3">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest text-center mb-4">Workspace Info</h4>
                  <div className="flex justify-between items-center text-sm py-2 border-b border-black/5 dark:border-white/5">
                    <span className="text-muted-foreground">Code</span>
                    <button className="font-mono font-bold bg-white dark:bg-black/20 px-2 py-1 rounded text-primary hover:text-primary/80 transition-colors" onClick={() => navigator.clipboard.writeText(stats.organization.inviteCode)}>
                      {stats.organization.inviteCode}
                    </button>
                  </div>
                  <div className="flex justify-between items-center text-sm pt-2">
                    <span className="text-muted-foreground">Tasks</span>
                    <span className="font-brand font-bold text-foreground">{stats.statistics.completedTasks} <span className="text-muted-foreground font-sans font-normal text-xs">/ {stats.statistics.taskCount}</span></span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
