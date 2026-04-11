import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { catchError, map, Observable, of, switchMap, throwError } from 'rxjs';
import { GitHubConnectionState, GitHubRepo, SyncStatus } from '../models/github-integration.model';
import { SlackConnectionState } from '../models/slack-integration.model';
import { toError } from './http-error';

interface IntegrationRecord {
  id: number;
  provider: 'slack' | 'github';
  workspace_id?: number;
  metadata?: string;
  updated_at: string;
}

interface SlackChannelsResponse {
  channels: Array<{
    id: string;
    name: string;
  }>;
}

interface GitHubRepoResponse {
  id: number;
  name: string;
  full_name: string;
  owner?: {
    login?: string;
  };
}

interface OAuthResponse {
  auth_url: string;
}

interface GitHubSyncResponse {
  status: string;
}

@Injectable({
  providedIn: 'root',
})
export class IntegrationService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/integrations';

  getSlackAuthUrl(workspaceId: string): Observable<{ authUrl: string }> {
    const params = new HttpParams().set('workspace_id', workspaceId);
    return this.http.get<OAuthResponse>(`${this.apiUrl}/slack/auth`, { params }).pipe(
      map((response) => ({ authUrl: response.auth_url })),
      catchError((error) => throwError(() => toError(error, 'Unable to start Slack connection.'))),
    );
  }

  connectSlack(workspaceId: string): Observable<void> {
    return this.getSlackAuthUrl(workspaceId).pipe(
      map(({ authUrl }) => {
        window.location.assign(authUrl);
      }),
    );
  }

  getSlackChannels(workspaceId: string): Observable<SlackConnectionState> {
    return this.getIntegrations(workspaceId).pipe(
      switchMap((integrations) => {
        const slackIntegration = integrations.find((integration) => integration.provider === 'slack');
        if (!slackIntegration) {
          return of({
            connected: false,
            channels: [],
          });
        }

        const metadata = this.parseMetadata(slackIntegration.metadata);
        const params = new HttpParams().set('integration_id', String(slackIntegration.id));

        return this.http.get<SlackChannelsResponse>(`${this.apiUrl}/slack/channels`, { params }).pipe(
          map((response) => ({
            connected: true,
            workspaceName: this.readString(metadata['team_name']),
            workspaceUrl: this.readString(metadata['team_domain']),
            channels: response.channels.map((channel) => ({
              id: channel.id,
              name: channel.name,
              isConnected: this.readStringArray(metadata['selected_channels']).includes(channel.id),
            })),
            lastSyncAt: slackIntegration.updated_at ? new Date(slackIntegration.updated_at) : undefined,
          })),
        );
      }),
      catchError((error) => throwError(() => toError(error, 'Unable to load Slack channels.'))),
    );
  }

  updateSlackChannels(workspaceId: string, channelIds: string[]): Observable<void> {
    const params = new HttpParams().set('workspace_id', workspaceId);
    return this.http
      .patch<void>(`${this.apiUrl}/slack/channels`, { channel_ids: channelIds }, { params })
      .pipe(
        catchError((error) => throwError(() => toError(error, 'Unable to save Slack channel selection.'))),
      );
  }

  disconnectSlack(workspaceId: string): Observable<void> {
    return this.getIntegrations(workspaceId).pipe(
      switchMap((integrations) => {
        const slackIntegration = integrations.find((integration) => integration.provider === 'slack');
        if (!slackIntegration) {
          return of(void 0);
        }
        return this.http.delete<void>(`${this.apiUrl}/${slackIntegration.id}`);
      }),
      catchError((error) => throwError(() => toError(error, 'Unable to disconnect Slack.'))),
    );
  }

  getGitHubAuthUrl(workspaceId: string, redirectUrl?: string): Observable<{ authUrl: string }> {
    let params = new HttpParams().set('workspace_id', workspaceId);
    if (redirectUrl) {
      params = params.set('redirect_url', redirectUrl);
    }

    return this.http.get<OAuthResponse>(`${this.apiUrl}/github/auth`, { params }).pipe(
      map((response) => ({ authUrl: response.auth_url })),
      catchError((error) => throwError(() => toError(error, 'Unable to start GitHub connection.'))),
    );
  }

  connectGitHub(workspaceId: string): Observable<void> {
    const redirectUrl = typeof window !== 'undefined' ? window.location.href : undefined;

    return this.getGitHubAuthUrl(workspaceId, redirectUrl).pipe(
      map(({ authUrl }) => {
        window.location.assign(authUrl);
      }),
    );
  }

  getGitHubRepos(workspaceId: string): Observable<GitHubConnectionState> {
    return this.getIntegrations(workspaceId).pipe(
      switchMap((integrations) => {
        const githubIntegration = integrations.find((integration) => integration.provider === 'github');
        if (!githubIntegration) {
          return of({
            connected: false,
            repos: [],
          });
        }

        const metadata = this.parseMetadata(githubIntegration.metadata);
        const selectedRepoIds = this.readNumberArray(metadata['selected_repo_ids']);

        const params = new HttpParams().set('workspace_id', workspaceId);

        return this.http.get<GitHubRepoResponse[]>(`${this.apiUrl}/github/repos`, { params }).pipe(
          map((repos) => ({
            connected: true,
            repos: repos.map((repo) => this.mapGitHubRepo(repo, selectedRepoIds)),
            accountName: repos[0]?.owner?.login ?? undefined,
            accountHandle: repos[0]?.owner?.login ? `@${repos[0].owner.login}` : undefined,
            lastSyncAt: githubIntegration.updated_at ? new Date(githubIntegration.updated_at) : undefined,
          })),
        );
      }),
      catchError((error) => throwError(() => toError(error, 'Unable to load GitHub repositories.'))),
    );
  }

  updateGitHubRepos(workspaceId: string, repoIds: number[]): Observable<void> {
    const params = new HttpParams().set('workspace_id', workspaceId);
    return this.http.patch<void>(`${this.apiUrl}/github/repos`, { repo_ids: repoIds }, { params }).pipe(
      catchError((error) => throwError(() => toError(error, 'Unable to save repository selection.'))),
    );
  }

  disconnectGitHub(workspaceId: string): Observable<void> {
    const params = new HttpParams().set('workspace_id', workspaceId);
    return this.http.delete<void>(`${this.apiUrl}/github`, { params }).pipe(
      catchError((error) => throwError(() => toError(error, 'Unable to disconnect GitHub.'))),
    );
  }

  syncGitHub(workspaceId: string): Observable<SyncStatus> {
    const params = new HttpParams().set('workspace_id', workspaceId);
    return this.http.post<GitHubSyncResponse>(`${this.apiUrl}/github/sync`, {}, { params }).pipe(
      map((response) => {
        const status: SyncStatus['status'] = response.status === 'sync_started' ? 'in_progress' : 'failed';
        return {
          syncId: `sync-${Date.now()}`,
          status,
        };
      }),
      catchError((error) => throwError(() => toError(error, 'Unable to sync GitHub.'))),
    );
  }

  private getIntegrations(workspaceId?: string): Observable<IntegrationRecord[]> {
    let params = new HttpParams();
    if (workspaceId) {
      params = params.set('workspace_id', workspaceId);
    }

    return this.http.get<IntegrationRecord[]>(this.apiUrl, { params }).pipe(
      catchError((error) => {
        if (error.status === 404) {
          return of([]);
        }
        return throwError(() => toError(error, 'Unable to load integrations.'));
      }),
    );
  }

  private parseMetadata(metadata?: string): Record<string, unknown> {
    if (!metadata) {
      return {};
    }

    try {
      const parsed = JSON.parse(metadata);
      return typeof parsed === 'object' && parsed !== null ? parsed as Record<string, unknown> : {};
    } catch {
      return {};
    }
  }

  private readString(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim() ? value : undefined;
  }

  private readStringArray(value: unknown): string[] {
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
  }

  private readNumberArray(value: unknown): number[] {
    return Array.isArray(value) ? value.filter((item): item is number => typeof item === 'number') : [];
  }

  private mapGitHubRepo(repo: GitHubRepoResponse, selectedRepoIds: number[]): GitHubRepo {
    return {
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      isConnected: selectedRepoIds.includes(repo.id),
    };
  }
}
