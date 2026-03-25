export interface SlackChannel {
  id: string;
  name: string;
  isConnected: boolean;
}

export interface SlackConnectionState {
  connected: boolean;
  workspaceName?: string;
  workspaceUrl?: string;
  channels: SlackChannel[];
  lastSyncAt?: Date;
}
