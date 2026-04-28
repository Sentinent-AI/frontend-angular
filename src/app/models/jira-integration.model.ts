export interface JiraProject {
  id: string;
  key: string;
  name: string;
  avatarUrl?: string;
  siteId: string;
  siteName: string;
  siteUrl: string;
}

export interface JiraSyncStatus {
  status: 'idle' | 'in_progress' | 'completed' | 'error';
  lastSyncAt?: string;
  message?: string;
}

export interface JiraIntegrationResponse {
  connected: boolean;
  projects: JiraProject[];
  lastSyncAt?: Date;
}
