export interface JiraProject {
  id: string;
  key: string;
  name: string;
  avatarUrl: string;
}

export interface AtlassianResource {
  id: string;
  url: string;
  name: string;
  scopes: string[];
  avatarUrl: string;
}

export interface JiraSyncStatus {
  status: 'idle' | 'in_progress' | 'completed' | 'error';
  lastSyncAt?: string;
  message?: string;
}

export interface JiraIntegrationResponse {
  connected: boolean;
  resources: AtlassianResource[];
  lastSyncAt?: string;
}
