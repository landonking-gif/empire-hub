import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { TaskStatusCard } from "@/components/dashboard/TaskStatusCard";
import { ApprovalCard } from "@/components/dashboard/ApprovalCard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { TaskDistributionChart } from "@/components/dashboard/TaskDistributionChart";
import { useAllData, useApprove, useReject } from "@/hooks/useKingAI";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Crown,
  Building2,
  DollarSign,
  Activity,
  CheckCircle,
  Clock,
  WifiOff,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const { data, isLoading, isError, error, refetch } = useAllData({ refetchInterval: 10000 });
  const approveMutation = useApprove();
  const rejectMutation = useReject();

  const handleApprove = (id: string) => {
    approveMutation.mutate({ id });
  };

  const handleReject = (id: string) => {
    rejectMutation.mutate({ id });
  };

  // Transform backend data to component-expected formats
  const activeTasks = data?.activeTasks?.map(t => ({
    id: t.id,
    name: t.name,
    status: (t.status === 'queued' ? 'pending' : t.status) as "running" | "pending" | "completed" | "failed",
    module: t.module || undefined,
    progress: t.progress,
    startedAt: t.created_at ? new Date(t.created_at).toLocaleTimeString() : undefined,
  })) || [];

  const recentTasks = data?.recentTasks?.map(t => ({
    id: t.id,
    name: t.name,
    status: t.status as "running" | "completed" | "failed" | "pending",
    module: t.module || undefined,
    startedAt: t.startedAt ? new Date(t.startedAt).toLocaleTimeString() : undefined,
  })) || [];

  const activities = data?.activities?.map(a => ({
    id: a.id,
    message: a.message,
    type: mapActivityType(a.type || a.level || 'info'),
    timestamp: a.timestamp ? new Date(a.timestamp).toLocaleTimeString() : 'now',
    module: a.module || undefined,
  })) || [];

  const pendingApprovals = data?.approvals?.map(a => ({
    id: a.id,
    title: a.description?.split('\n')[0] || 'Pending Approval',
    type: mapApprovalType(a.taskType || a.type || 'technical'),
    module: 'CEO',
    description: a.description || '',
    urgency: mapUrgency(a.riskLevel || 'standard'),
    requestedAt: a.createdAt || a.created_at || new Date().toISOString(),
    cost: undefined,
  })) || [];

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

  function mapApprovalType(type: string): "legal" | "financial" | "strategic" | "technical" {
    const lower = type.toLowerCase();
    if (lower.includes('legal') || lower.includes('contract')) return 'legal';
    if (lower.includes('financial') || lower.includes('payment') || lower.includes('cost')) return 'financial';
    if (lower.includes('strategic') || lower.includes('decision')) return 'strategic';
    return 'technical';
  }

  function mapUrgency(level: string): "high" | "medium" | "low" {
    const lower = level.toLowerCase();
    if (lower.includes('high') || lower.includes('urgent') || lower.includes('critical')) return 'high';
    if (lower.includes('low') || lower.includes('minor')) return 'low';
    return 'medium';
  }

  if (isError) {
    return (
      <DashboardLayout>
        <div className="p-6 flex flex-col items-center justify-center min-h-[60vh]">
          <WifiOff className="w-16 h-16 text-destructive mb-4" />
          <h2 className="text-2xl font-bold mb-2">Cannot Connect to Backend</h2>
          <p className="text-muted-foreground mb-4 text-center max-w-md">
            {error?.message || 'Failed to connect to the King AI backend.'}
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Ensure the server is running at {window.location.host}
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold gold-text">
              Empire Command Center
            </h1>
            <p className="text-muted-foreground mt-1">
              {isLoading ? 'Connecting to backend...' :
                `Welcome back, Emperor. ${data?.ceoStatus?.mode ? `Mode: ${data.ceoStatus.mode}` : 'Your autonomous operations are running.'}`}
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-success/10 border border-success/30">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-sm text-success">
              {isLoading ? 'Connecting...' : 'Connected to EC2'}
            </span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading ? (
            <>
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </>
          ) : (
            <>
              <MetricCard
                title="Active Businesses"
                value={data?.businesses?.length || 0}
                change={data?.businesses?.length ? 25 : 0}
                changeLabel="this quarter"
                icon={<Building2 className="w-5 h-5" />}
              />
              <MetricCard
                title="Total Profit"
                value={`$${((data?.totalProfit || 0) / 1000).toFixed(1)}K`}
                change={18}
                changeLabel="vs last month"
                icon={<DollarSign className="w-5 h-5" />}
              />
              <MetricCard
                title="Tasks Completed"
                value={recentTasks.filter(t => t.status === 'completed').length}
                change={34}
                changeLabel="this week"
                icon={<CheckCircle className="w-5 h-5" />}
              />
              <MetricCard
                title="Pending Approvals"
                value={pendingApprovals.length}
                icon={<Clock className="w-5 h-5" />}
              />
            </>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Charts */}
          <div className="lg:col-span-2 space-y-6">
            <RevenueChart />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TaskStatusCard
                title="Active Tasks"
                tasks={activeTasks}
                showProgress
              />
              <TaskDistributionChart />
            </div>
          </div>

          {/* Right Column - Activity & Approvals */}
          <div className="space-y-6">
            <div className="glass-card p-5">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Live Activity
              </h3>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                </div>
              ) : (
                <ActivityFeed activities={activities.slice(0, 10)} maxHeight="300px" />
              )}
            </div>

            <div className="glass-card p-5">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Crown className="w-5 h-5 text-primary" />
                Awaiting Your Decision
              </h3>
              <div className="space-y-4">
                {isLoading ? (
                  <>
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                  </>
                ) : pendingApprovals.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">
                    No pending approvals
                  </p>
                ) : (
                  pendingApprovals.slice(0, 2).map((approval) => (
                    <ApprovalCard
                      key={approval.id}
                      approval={approval}
                      onApprove={handleApprove}
                      onReject={handleReject}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Tasks */}
        <TaskStatusCard title="Recent Task History" tasks={recentTasks} />
      </div>
    </DashboardLayout>
  );
};

export default Index;
