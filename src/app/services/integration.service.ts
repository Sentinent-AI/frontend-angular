import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { catchError, map, Observable, of, switchMap, throwError } from 'rxjs';
import { GitHubConnectionState, GitHubRepo, SyncStatus } from '../models/github-integration.model';
import { SlackConnectionState } from '../models/slack-integration.model';
import { toError } from './http-error';

interface IntegrationRecord {
  id: number;
  provider: 'slack' | 'github' | 'jira';
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
        window.open(authUrl, '_blank');
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

  getGitHubAuthUrl(): Observable<{ authUrl: string }> {
    return this.http.get<OAuthResponse>(`${this.apiUrl}/github/auth`).pipe(
      map((response) => ({ authUrl: response.auth_url })),
      catchError((error) => throwError(() => toError(error, 'Unable to start GitHub connection.'))),
    );
  }

  connectGitHub(): Observable<void> {
    return this.getGitHubAuthUrl().pipe(
      map(({ authUrl }) => {
        window.open(authUrl, '_blank');
      }),
    );
  }

  getGitHubRepos(): Observable<GitHubConnectionState> {
    return this.getIntegrations().pipe(
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

        return this.http.get<GitHubRepoResponse[]>(`${this.apiUrl}/github/repos`).pipe(
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

  updateGitHubRepos(repoIds: number[]): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/github/repos`, { repo_ids: repoIds }).pipe(
      catchError((error) => throwError(() => toError(error, 'Unable to save repository selection.'))),
    );
  }

  disconnectGitHub(): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/github`).pipe(
      catchError((error) => throwError(() => toError(error, 'Unable to disconnect GitHub.'))),
    );
  }

  syncGitHub(): Observable<SyncStatus> {
    return this.http.post<GitHubSyncResponse>(`${this.apiUrl}/github/sync`, {}).pipe(
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

  getJiraAuthUrl(workspaceId: string): Observable<{ authUrl: string }> {
    const params = new HttpParams().set('workspace_id', workspaceId);
    return this.http.get<OAuthResponse>(`${this.apiUrl}/jira/auth`, { params }).pipe(
      map((response) => ({ authUrl: response.auth_url })),
      catchError((error) => throwError(() => toError(error, 'Unable to start Jira connection.'))),
    );
  }

  connectJira(workspaceId: string): Observable<void> {
    return this.getJiraAuthUrl(workspaceId).pipe(
      map(({ authUrl }) => {
        window.open(authUrl, '_blank');
      }),
    );
  }

  getJiraProjects(workspaceId: string): Observable<any> {
    return this.getIntegrations(workspaceId).pipe(
      switchMap((integrations) => {
        const jiraIntegration = integrations.find((integration) => integration.provider === 'jira');
        if (!jiraIntegration) {
          return of({
            connected: false,
            resources: [],
          });
        }

        const params = new HttpParams().set('workspace_id', workspaceId);
        return this.http.get<any[]>(`${this.apiUrl}/jira/projects`, { params }).pipe(
          map((resources) => ({
            connected: true,
            resources: resources,
            lastSyncAt: jiraIntegration.updated_at ? new Date(jiraIntegration.updated_at) : undefined,
          })),
        );
      }),
      catchError((error) => throwError(() => toError(error, 'Unable to load Jira projects.'))),
    );
  }

  disconnectJira(workspaceId: string): Observable<void> {
    const params = new HttpParams().set('workspace_id', workspaceId);
    return this.http.delete<void>(`${this.apiUrl}/jira`, { params }).pipe(
      catchError((error) => throwError(() => toError(error, 'Unable to disconnect Jira.'))),
    );
  }

  syncJira(workspaceId: string): Observable<any> {
    const params = new HttpParams().set('workspace_id', workspaceId);
    return this.http.post<any>(`${this.apiUrl}/jira/sync`, {}, { params }).pipe(
      map((response) => {
        return {
          status: response.status === 'sync_started' ? 'in_progress' : 'failed',
        };
      }),
      catchError((error) => throwError(() => toError(error, 'Unable to sync Jira.'))),
    );
  }

  getJiraTransitions(workspaceId: string, issueKey: string): Observable<any[]> {
    const params = new HttpParams().set('workspace_id', workspaceId);
    return this.http.get<any[]>(`${this.apiUrl}/jira/issues/${issueKey}/transitions`, { params }).pipe(
      catchError((error) => throwError(() => toError(error, 'Unable to load Jira transitions.'))),
    );
  }

  performJiraTransition(workspaceId: string, issueKey: string, transitionId: string): Observable<void> {
    const params = new HttpParams().set('workspace_id', workspaceId);
    return this.http.post<void>(`${this.apiUrl}/jira/issues/${issueKey}/transitions`, { transitionId }, { params }).pipe(
      catchError((error) => {
        // If it's a 400, it might be due to missing fields required by the transition
        if (error.status === 400) {
          return throwError(() => new Error('This transition requires additional fields. Please update directly in Jira.'));
        }
        return throwError(() => toError(error, 'Unable to perform Jira transition.'));
      }),
    );
  }

  addJiraComment(workspaceId: string, issueKey: string, comment: string): Observable<void> {
    const params = new HttpParams().set('workspace_id', workspaceId);
    return this.http.post<void>(`${this.apiUrl}/jira/issues/${issueKey}/comments`, { body: comment }, { params }).pipe(
      catchError((error) => throwError(() => toError(error, 'Unable to add Jira comment.'))),
    );
  }

  private getIntegrations(workspaceId?: string): Observable<IntegrationRecord[]> {
    let params = new HttpParams();
    if (workspaceId) {
      params = params.set('workspace_id', workspaceId);
    }

    return this.http.get<IntegrationRecord[]>(this.apiUrl, { params }).pipe(
      map((records) => {
        console.log('[IntegrationService] getIntegrations response:', JSON.stringify(records));
        return records;
      }),
      catchError((error) => {
        console.error('[IntegrationService] getIntegrations error:', error.status, error.message);
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

  /**
   * Checks Jira connection status by looking for the integration record in the DB.
   * This is separate from getJiraProjects() which makes actual Jira API calls.
   * Connection state should be determined by the DB record, not by whether the API is reachable.
   */
  getJiraStatus(workspaceId: string): Observable<{ connected: boolean; lastSyncAt?: Date }> {
    console.log('[IntegrationService] getJiraStatus called for workspace:', workspaceId);
    return this.getIntegrations(workspaceId).pipe(
      map((integrations) => {
        const jiraIntegration = integrations.find((i) => i.provider === 'jira');
        const result = {
          connected: !!jiraIntegration,
          lastSyncAt: jiraIntegration?.updated_at ? new Date(jiraIntegration.updated_at) : undefined,
        };
        console.log('[IntegrationService] getJiraStatus result:', result, 'jiraRecord:', jiraIntegration);
        return result;
      }),
      catchError((err) => {
        console.error('[IntegrationService] getJiraStatus error:', err);
        return of({ connected: false });
      }),
    );
  }
}
