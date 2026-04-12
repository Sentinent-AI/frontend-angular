export type SignalSourceType = 'slack' | 'github' | 'email' | 'decision' | 'jira';
export type SignalStatus = 'unread' | 'read' | 'archived';

export interface SignalMetadata {
  type?: 'issue' | 'pull_request';
  number?: number;
  repository?: string;
  state?: 'open' | 'closed';
  labels?: string[];
  assignees?: string[];
  createdAt?: Date;
  updatedAt?: Date;
  issueType?: string;
  priority?: string;
  projectKey?: string;
  [key: string]: unknown;
}

export interface Signal {
  id: string;
  sourceType: SignalSourceType;
  sourceId: string;
  externalId: string;
  title: string;
  content: string;
  author: string;
  status: SignalStatus;
  receivedAt: Date;
  url?: string;
  metadata: SignalMetadata;
}

export interface SignalFilters {
  source: 'all' | 'github' | 'slack' | 'decision' | 'jira';
  status: 'all' | SignalStatus;
}
