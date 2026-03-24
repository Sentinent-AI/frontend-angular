export interface GitHubRepo {
  id: number;
  name: string;
  fullName: string;
  isConnected: boolean;
}

export interface SyncStatus {
  syncId: string;
  status: 'in_progress' | 'completed' | 'failed';
  itemsSynced?: number;
  completedAt?: Date;
}

export interface GitHubConnectionState {
  connected: boolean;
  accountName?: string;
  accountHandle?: string;
  repos: GitHubRepo[];
  lastSyncAt?: Date;
}
