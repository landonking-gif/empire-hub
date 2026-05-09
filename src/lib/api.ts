/**
 * King AI Studio API Client
 * Connects to the backend running on EC2
 */

// Backend API URL - Update this if your server moves
const API_BASE_URL = window.location.origin;

export interface Business {
  id: string;
  name: string;
  status: string;
  phase?: string;
  revenue?: number;
  mrr?: number;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Approval {
  id: string;
  taskType?: string;
  type?: string;
  description: string;
  data?: any;
  riskLevel?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt?: string;
  created_at?: string;
  notes?: string;
}

export interface Task {
  id: string;
  name: string;
  status: 'running' | 'queued' | 'pending' | 'completed' | 'failed';
  module?: string;
  progress?: number;
  business_id?: string;
  created_at?: string;
  startedAt?: string;
}

export interface Activity {
  id: string;
  message: string;
  type: string;
  level?: string;
  icon?: string;
  timestamp: string;
  module?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: string;
  thinking?: string;
}

export interface CEOStatus {
  mode?: string;
  activeBusiness?: Business;
  currentPhase?: string;
  tasksCompleted?: number;
  tasksTotal?: number;
  error?: string;
}

export interface AllDataResponse {
  businesses: Business[];
  approvals: Approval[];
  logs: any[];
  activeTasks: Task[];
  recentTasks: Task[];
  activities: Activity[];
  chat: ChatMessage[];
  totalProfit: number;
  ceoStatus: CEOStatus | null;
}

export interface CommandResponse {
  reply: string;
  thoughts?: string | null;
  fallback?: boolean;
}

class KingAIClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options?.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Cannot connect to King AI backend. Ensure the server is running.');
      }
      throw error;
    }
  }

  /**
   * Get all dashboard data in a single request
   */
  async getAllData(): Promise<AllDataResponse> {
    return this.request<AllDataResponse>('/api/all-data');
  }

  /**
   * Get pending approvals
   */
  async getPendingApprovals(): Promise<Approval[]> {
    return this.request<Approval[]>('/api/pending');
  }

  /**
   * Approve an item
   */
  async approve(id: string, notes?: string): Promise<{ success: boolean; item?: Approval; error?: string }> {
    return this.request('/api/approve', {
      method: 'POST',
      body: JSON.stringify({ id, notes }),
    });
  }

  /**
   * Reject an item
   */
  async reject(id: string, reason?: string): Promise<{ success: boolean; item?: Approval; error?: string }> {
    return this.request('/api/reject', {
      method: 'POST',
      body: JSON.stringify({ id, reason }),
    });
  }

  /**
   * Send a command to King AI
   */
  async sendCommand(command: string): Promise<CommandResponse> {
    return this.request<CommandResponse>('/api/command', {
      method: 'POST',
      body: JSON.stringify({ command }),
    });
  }

  /**
   * Check if the backend is reachable
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.request('/api/pending');
      return true;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const kingAI = new KingAIClient();

// Export class for custom instances
export { KingAIClient };
