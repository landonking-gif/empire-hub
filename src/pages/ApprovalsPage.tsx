import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ApprovalCard } from "@/components/dashboard/ApprovalCard";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAllData, useApprove, useReject } from "@/hooks/useKingAI";
import {
  Shield,
  DollarSign,
  AlertTriangle,
  FileText,
  CheckCircle,
  History,
  WifiOff,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const ApprovalsPage = () => {
  const { data, isLoading, isError, error, refetch } = useAllData({ refetchInterval: 5000 });
  const approveMutation = useApprove();
  const rejectMutation = useReject();
  const [filter, setFilter] = useState<string>("all");

  // Transform backend approvals to component format
  const pendingApprovals = useMemo(() => {
    return data?.approvals?.map(a => ({
      id: a.id,
      title: a.description?.split('\n')[0] || 'Pending Approval',
      type: mapApprovalType(a.taskType || a.type || 'technical') as "legal" | "financial" | "strategic" | "technical",
      module: 'CEO',
      description: a.description || '',
      urgency: mapUrgency(a.riskLevel || 'standard') as "high" | "medium" | "low",
      requestedAt: a.createdAt || a.created_at || new Date().toISOString(),
      cost: undefined,
    })) || [];
  }, [data?.approvals]);

  function mapApprovalType(type: string): string {
    const lower = type.toLowerCase();
    if (lower.includes('legal') || lower.includes('contract')) return 'legal';
    if (lower.includes('financial') || lower.includes('payment') || lower.includes('cost')) return 'financial';
    if (lower.includes('strategic') || lower.includes('decision')) return 'strategic';
    return 'technical';
  }

  function mapUrgency(level: string): string {
    const lower = level.toLowerCase();
    if (lower.includes('high') || lower.includes('urgent') || lower.includes('critical')) return 'high';
    if (lower.includes('low') || lower.includes('minor')) return 'low';
    return 'medium';
  }

  const handleApprove = (id: string) => {
    approveMutation.mutate({ id });
  };

  const handleReject = (id: string) => {
    rejectMutation.mutate({ id });
  };

  const filterCounts = {
    all: pendingApprovals.length,
    legal: pendingApprovals.filter((a) => a.type === "legal").length,
    financial: pendingApprovals.filter((a) => a.type === "financial").length,
    strategic: pendingApprovals.filter((a) => a.type === "strategic").length,
    technical: pendingApprovals.filter((a) => a.type === "technical").length,
  };

  const filteredApprovals = pendingApprovals.filter(
    (a) => filter === "all" || a.type === filter
  );

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
            <h1 className="text-3xl font-display font-bold gold-text">
              Approval Center
            </h1>
            <p className="text-muted-foreground mt-1">
              Critical decisions requiring your authorization
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="py-2 px-4 border-warning/50 text-warning">
              {pendingApprovals.length} Pending
            </Badge>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(filterCounts).map(([type, count]) => {
            const icons: Record<string, React.ReactNode> = {
              all: null,
              legal: <Shield className="w-4 h-4" />,
              financial: <DollarSign className="w-4 h-4" />,
              strategic: <AlertTriangle className="w-4 h-4" />,
              technical: <FileText className="w-4 h-4" />,
            };
            return (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                  filter === type
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-secondary/30 text-muted-foreground hover:text-foreground"
                }`}
              >
                {icons[type]}
                <span className="capitalize">{type}</span>
                <Badge variant="secondary" className="ml-1">
                  {count}
                </Badge>
              </button>
            );
          })}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pending Approvals */}
          <div className="lg:col-span-2 space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-40" />
                <Skeleton className="h-40" />
                <Skeleton className="h-40" />
              </div>
            ) : filteredApprovals.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <CheckCircle className="w-12 h-12 text-success mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">All Clear</h3>
                <p className="text-muted-foreground">
                  No pending approvals. The empire runs smoothly.
                </p>
              </div>
            ) : (
              filteredApprovals.map((approval) => (
                <ApprovalCard
                  key={approval.id}
                  approval={approval}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              ))
            )}
          </div>

          {/* History Sidebar */}
          <div className="space-y-6">
            <div className="glass-card p-5">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <History className="w-5 h-5 text-primary" />
                Recent Decisions
              </h3>
              <div className="space-y-3">
                {isLoading ? (
                  <>
                    <Skeleton className="h-20" />
                    <Skeleton className="h-20" />
                    <Skeleton className="h-20" />
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Decision history will appear here
                  </p>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="glass-card p-5 space-y-4">
              <h3 className="text-lg font-semibold">Approval Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total Businesses</span>
                  <span className="font-semibold">{data?.businesses?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Active Tasks</span>
                  <span className="font-semibold">{data?.activeTasks?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">CEO Status</span>
                  <span className="font-semibold text-success">{data?.ceoStatus?.mode || 'Unknown'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ApprovalsPage;
