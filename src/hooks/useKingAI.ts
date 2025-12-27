import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { kingAI, AllDataResponse, Approval, CommandResponse } from '@/lib/api';
import { toast } from 'sonner';

/**
 * Hook to fetch all dashboard data from the King AI backend
 */
export function useAllData(options?: { refetchInterval?: number }) {
  return useQuery<AllDataResponse>({
    queryKey: ['king-ai', 'all-data'],
    queryFn: () => kingAI.getAllData(),
    refetchInterval: options?.refetchInterval ?? 10000, // Poll every 10s by default
    retry: 2,
    staleTime: 5000,
  });
}

/**
 * Hook to fetch pending approvals
 */
export function usePendingApprovals() {
  return useQuery<Approval[]>({
    queryKey: ['king-ai', 'pending-approvals'],
    queryFn: () => kingAI.getPendingApprovals(),
    refetchInterval: 10000,
    retry: 2,
  });
}

/**
 * Hook to approve an item
 */
export function useApprove() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) => 
      kingAI.approve(id, notes),
    onSuccess: (data) => {
      if (data.success) {
        toast.success('Approval submitted successfully');
        queryClient.invalidateQueries({ queryKey: ['king-ai'] });
      } else {
        toast.error(data.error || 'Failed to approve');
      }
    },
    onError: (error: Error) => {
      toast.error(`Approval failed: ${error.message}`);
    },
  });
}

/**
 * Hook to reject an item
 */
export function useReject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => 
      kingAI.reject(id, reason),
    onSuccess: (data) => {
      if (data.success) {
        toast.success('Rejection submitted successfully');
        queryClient.invalidateQueries({ queryKey: ['king-ai'] });
      } else {
        toast.error(data.error || 'Failed to reject');
      }
    },
    onError: (error: Error) => {
      toast.error(`Rejection failed: ${error.message}`);
    },
  });
}

/**
 * Hook to send commands to King AI
 */
export function useSendCommand() {
  const queryClient = useQueryClient();

  return useMutation<CommandResponse, Error, string>({
    mutationFn: (command: string) => kingAI.sendCommand(command),
    onSuccess: () => {
      // Refresh data after sending a command
      queryClient.invalidateQueries({ queryKey: ['king-ai'] });
    },
    onError: (error: Error) => {
      toast.error(`Command failed: ${error.message}`);
    },
  });
}

/**
 * Hook to check backend connectivity
 */
export function useHealthCheck() {
  return useQuery<boolean>({
    queryKey: ['king-ai', 'health'],
    queryFn: () => kingAI.healthCheck(),
    refetchInterval: 30000, // Check every 30s
    retry: 1,
  });
}
