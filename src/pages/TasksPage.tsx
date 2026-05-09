import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { TaskStatusCard, TaskStatus } from "@/components/dashboard/TaskStatusCard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAllData } from "@/hooks/useKingAI";
import {
  Search,
  Filter,
  Play,
  Pause,
  RotateCcw,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  WifiOff,
  RefreshCw,
} from "lucide-react";

const TasksPage = () => {
  const { data, isLoading, isError, error, refetch } = useAllData({ refetchInterval: 5000 });
  const [filter, setFilter] = useState<TaskStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Combine active and recent tasks from backend
  const allTasks = useMemo(() => {
    const active = data?.activeTasks?.map(t => ({
      id: t.id,
      name: t.name,
      status: (t.status === 'queued' ? 'pending' : t.status) as TaskStatus,
      module: t.module || 'System',
      progress: t.progress,
      startedAt: t.created_at ? new Date(t.created_at).toLocaleTimeString() : undefined,
    })) || [];

    const recent = data?.recentTasks?.map(t => ({
      id: t.id,
      name: t.name,
      status: t.status as TaskStatus,
      module: t.module || 'System',
      progress: undefined,
      startedAt: t.startedAt ? new Date(t.startedAt).toLocaleTimeString() : undefined,
    })) || [];

    return [...active, ...recent];
  }, [data?.activeTasks, data?.recentTasks]);

  const activities = useMemo(() => {
    return data?.activities?.map(a => ({
      id: a.id,
      message: a.message,
      type: mapActivityType(a.type || a.level || 'info'),
      timestamp: a.timestamp ? new Date(a.timestamp).toLocaleTimeString() : 'now',
      module: a.module || undefined,
    })) || [];
  }, [data?.activities]);

  function mapActivityType(type: string): "success" | "error" | "info" | "action" | "thinking" | "code" | "business" {
    const lower = type.toLowerCase();
    if (lower.includes('success') || lower.includes('complete')) return 'success';
    if (lower.includes('error') || lower.includes('fail')) return 'error';
    if (lower.includes('action') || lower.includes('execute')) return 'action';
    if (lower.includes('think') || lower.includes('ai')) return 'thinking';
    if (lower.includes('code') || lower.includes('deploy')) return 'code';
    if (lower.includes('business') || lower.includes('revenue')) return 'business';
    return 'info';
  }

  const statusCounts = {
    all: allTasks.length,
    running: allTasks.filter((t) => t.status === "running").length,
    pending: allTasks.filter((t) => t.status === "pending").length,
    completed: allTasks.filter((t) => t.status === "completed").length,
    failed: allTasks.filter((t) => t.status === "failed").length,
  };

  const filteredTasks = allTasks.filter((task) => {
    const matchesFilter = filter === "all" || task.status === filter;
    const matchesSearch = (task.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (isError) {
    return (
      <DashboardLayout>
        <div className="p-6 flex flex-col items-center justify-center min-h-[60vh]">
          <WifiOff className="w-16 h-16 text-destructive mb-4" />
          <h2 className="text-2xl font-bold mb-2">Cannot Connect to Backend</h2>
          <p className="text-muted-foreground mb-4 text-center max-w-md">
            {error?.message || 'Failed to connect to the King AI backend.'}
          </p>
          <Button onClick={() => refetch()} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Retry Connection
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold gold-text">Task Command Center</h1>
            <p className="text-muted-foreground mt-1">
              Monitor and control all autonomous operations
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2">
              <Pause className="w-4 h-4" />
              Pause All
            </Button>
            <Button className="gap-2 bg-primary text-primary-foreground">
              <Play className="w-4 h-4" />
              Resume Queue
            </Button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="flex flex-wrap gap-3">
          {Object.entries(statusCounts).map(([status, count]) => (
            <button
              key={status}
              onClick={() => setFilter(status as TaskStatus | "all")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${filter === status
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-secondary/30 text-muted-foreground hover:text-foreground"
                }`}
            >
              {status === "running" && <Loader2 className="w-4 h-4 animate-spin" />}
              {status === "pending" && <Clock className="w-4 h-4" />}
              {status === "completed" && <CheckCircle className="w-4 h-4" />}
              {status === "failed" && <XCircle className="w-4 h-4" />}
              <span className="capitalize">{status}</span>
              <Badge variant="secondary" className="ml-1">
                {count}
              </Badge>
            </button>
          ))}
        </div>

        {/* Search & Filter */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary/50 border-border/50"
            />
          </div>
          <Button variant="outline" className="gap-2" onClick={() => refetch()}>
            <RotateCcw className="w-4 h-4" />
            Refresh
          </Button>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Task List */}
          <div className="lg:col-span-2">
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  {filter === "all" ? "All Tasks" : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Tasks`}
                </h3>
                <Badge variant="outline">
                  {filteredTasks.length} tasks
                </Badge>
              </div>

              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No tasks found</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto scrollbar-thin">
                  {filteredTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-4 p-4 rounded-lg bg-secondary/30 border border-border/50 hover:border-primary/30 transition-colors"
                    >
                      <div className={`p-2 rounded-lg ${task.status === "running" ? "bg-primary/10" :
                          task.status === "completed" ? "bg-success/10" :
                            task.status === "failed" ? "bg-destructive/10" :
                              "bg-warning/10"
                        }`}>
                        {task.status === "running" && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
                        {task.status === "pending" && <Clock className="w-4 h-4 text-warning" />}
                        {task.status === "completed" && <CheckCircle className="w-4 h-4 text-success" />}
                        {task.status === "failed" && <XCircle className="w-4 h-4 text-destructive" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{task.name}</p>
                        <p className="text-sm text-muted-foreground">{task.module}</p>
                      </div>
                      {task.progress !== undefined && (
                        <div className="w-24">
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${task.progress}%` }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground text-right mt-1">
                            {task.progress}%
                          </p>
                        </div>
                      )}
                      {"startedAt" in task && task.startedAt && (
                        <span className="text-sm text-muted-foreground whitespace-nowrap">
                          {task.startedAt}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Activity Sidebar */}
          <div className="space-y-6">
            <div className="glass-card p-5">
              <h3 className="text-lg font-semibold mb-4">Execution Log</h3>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                </div>
              ) : (
                <ActivityFeed activities={activities.slice(0, 20)} maxHeight="500px" />
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TasksPage;
