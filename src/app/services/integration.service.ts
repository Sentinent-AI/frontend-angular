import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { GitHubConnectionState, GitHubRepo, SyncStatus } from '../models/github-integration.model';
import { SlackChannel, SlackConnectionState } from '../models/slack-integration.model';

@Injectable({
  providedIn: 'root'
})
export class IntegrationService {
  private slackState: SlackConnectionState = {
    connected: false,
    channels: [
      { id: 'C123456', name: 'general', isConnected: true },
      { id: 'C456789', name: 'engineering', isConnected: true },
      { id: 'C987654', name: 'product-launch', isConnected: false }
    ]
  };

  private githubState: GitHubConnectionState = {
    connected: false,
    repos: [
      { id: 101, name: 'frontend-angular', fullName: 'Sentinent-AI/frontend-angular', isConnected: true },
      { id: 102, name: 'backend-go', fullName: 'Sentinent-AI/backend-go', isConnected: false },
      { id: 103, name: 'Sentinent', fullName: 'Sentinent-AI/Sentinent', isConnected: true }
    ]
  };

  private latestSync: SyncStatus | null = null;

  getSlackAuthUrl(): Observable<{ authUrl: string }> {
    return of({
      authUrl: 'https://slack.com/oauth/v2/authorize?client_id=sentinent-demo&scope=channels:read%20chat:write&state=mock-state'
    });
  }

  getSlackChannels(): Observable<{ connected: boolean; channels: SlackChannel[]; workspaceName?: string; workspaceUrl?: string; lastSyncAt?: Date }> {
    return of({
      connected: this.slackState.connected,
      channels: this.slackState.channels,
      workspaceName: this.slackState.workspaceName,
      workspaceUrl: this.slackState.workspaceUrl,
      lastSyncAt: this.slackState.lastSyncAt
    });
  }

  connectSlack(): Observable<{ connected: boolean }> {
    this.slackState = {
      ...this.slackState,
      connected: true,
      workspaceName: 'Sentinent Ops',
      workspaceUrl: 'sentinent.slack.com'
    };

    return of({ connected: true });
  }

  updateSlackChannels(channelIds: string[]): Observable<void> {
    this.slackState = {
      ...this.slackState,
      channels: this.slackState.channels.map(channel => ({
        ...channel,
        isConnected: channelIds.includes(channel.id)
      })),
      lastSyncAt: new Date()
    };

    return of(void 0);
  }

  disconnectSlack(): Observable<void> {
    this.slackState = {
      ...this.slackState,
      connected: false,
      workspaceName: undefined,
      workspaceUrl: undefined,
      lastSyncAt: undefined,
      channels: this.slackState.channels.map(channel => ({
        ...channel,
        isConnected: false
      }))
    };

    return of(void 0);
  }

  getGitHubAuthUrl(): Observable<{ authUrl: string }> {
    return of({
      authUrl: 'https://github.com/login/oauth/authorize?client_id=sentinent-demo&scope=read:user%20read:org%20repo&state=mock-state'
    });
  }

  getGitHubRepos(): Observable<{ connected: boolean; repos: GitHubRepo[]; accountName?: string; accountHandle?: string; lastSyncAt?: Date }> {
    return of({
      connected: this.githubState.connected,
      repos: this.githubState.repos,
      accountName: this.githubState.accountName,
      accountHandle: this.githubState.accountHandle,
      lastSyncAt: this.githubState.lastSyncAt
    });
  }

  connectGitHub(): Observable<{ connected: boolean }> {
    this.githubState = {
      ...this.githubState,
      connected: true,
      accountName: 'Sentinent Engineering',
      accountHandle: '@sentinent-dev'
    };

    return of({ connected: true });
  }

  updateGitHubRepos(repoIds: number[]): Observable<void> {
    this.githubState = {
      ...this.githubState,
      repos: this.githubState.repos.map(repo => ({
        ...repo,
        isConnected: repoIds.includes(repo.id)
      }))
    };

    return of(void 0);
  }

  disconnectGitHub(): Observable<void> {
    this.githubState = {
      ...this.githubState,
      connected: false,
      accountName: undefined,
      accountHandle: undefined,
      lastSyncAt: undefined,
      repos: this.githubState.repos.map(repo => ({
        ...repo,
        isConnected: false
      }))
    };
    this.latestSync = null;

    return of(void 0);
  }

  syncGitHub(): Observable<{ syncId: string }> {
    if (!this.githubState.connected) {
      return throwError(() => new Error('Connect GitHub before starting a sync.'));
    }

    const syncId = `sync-${Date.now()}`;
    this.latestSync = {
      syncId,
      status: 'completed',
      itemsSynced: this.githubState.repos.filter(repo => repo.isConnected).length * 6,
      completedAt: new Date()
    };
    this.githubState = {
      ...this.githubState,
      lastSyncAt: this.latestSync.completedAt
    };

    return of({ syncId });
  }

  getSyncStatus(syncId: string): Observable<SyncStatus> {
    if (this.latestSync && this.latestSync.syncId === syncId) {
      return of(this.latestSync);
    }

    return of({
      syncId,
      status: 'failed'
    });
  }
}
