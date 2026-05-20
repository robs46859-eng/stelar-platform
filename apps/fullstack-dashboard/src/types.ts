export interface GatewayHealth {
  status: 'healthy' | 'degraded' | 'down';
  uptimePct: number;
  requestsPerMin: number;
  avgLatencyMs: number;
  errorRate: number;
}

export interface GatewayRequest {
  id: string;
  timestamp: string;
  method: string;
  path: string;
  statusCode: number;
  latencyMs: number;
  provider: string;
}

export interface ProviderStatus {
  name: string;
  status: 'online' | 'degraded' | 'offline';
  latencyMs: number;
  requestsToday: number;
}

export interface ArkhamReviewItem {
  id: string;
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface Agent {
  name: string;
  role: string;
  status: 'active' | 'idle' | 'error' | 'stopped';
  lastSeen: string;
  tasksCompleted: number;
}

export interface SecretHealth {
  name: string;
  lastRotated: string;
  daysUntilExpiry: number | null;
  status: 'ok' | 'expiring-soon' | 'expired';
}

export interface OverviewStats {
  gatewayStatus: GatewayHealth['status'];
  pendingReviews: number;
  activeAgents: number;
}
