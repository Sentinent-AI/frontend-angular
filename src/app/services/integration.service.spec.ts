import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { IntegrationService } from './integration.service';

describe('IntegrationService', () => {
  let service: IntegrationService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [IntegrationService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(IntegrationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('requests the Slack OAuth URL with the workspace id', () => {
    let authUrl = '';

    service.getSlackAuthUrl('7').subscribe((result) => {
      authUrl = result.authUrl;
    });

    const request = httpMock.expectOne('/api/integrations/slack/auth?workspace_id=7');
    expect(request.request.method).toBe('GET');
    request.flush({ auth_url: 'https://slack.com/oauth/mock' });

    expect(authUrl).toBe('https://slack.com/oauth/mock');
  });

  it('requests the Gmail OAuth URL with the return location', () => {
    let authUrl = '';

    service.getGmailAuthUrl('http://localhost:4200/workspaces/7/settings/integrations').subscribe((result) => {
      authUrl = result.authUrl;
    });

    const request = httpMock.expectOne('/api/integrations/gmail/auth?redirect_url=http://localhost:4200/workspaces/7/settings/integrations');
    expect(request.request.method).toBe('GET');
    request.flush({ auth_url: 'https://accounts.google.com/o/oauth2/auth' });

    expect(authUrl).toBe('https://accounts.google.com/o/oauth2/auth');
  });

  it('maps Slack channels using selected ids from integration metadata', () => {
    let result: any;

    service.getSlackChannels('9').subscribe((state) => {
      result = state;
    });

    const integrationsRequest = httpMock.expectOne('/api/integrations?workspace_id=9');
    expect(integrationsRequest.request.method).toBe('GET');
    integrationsRequest.flush([
      {
        id: 4,
        provider: 'slack',
        workspace_id: 9,
        metadata: JSON.stringify({
          team_name: 'Sentinent Ops',
          selected_channels: ['C123'],
        }),
        updated_at: '2026-03-24T10:00:00Z',
      },
    ]);

    const channelsRequest = httpMock.expectOne('/api/integrations/slack/channels?integration_id=4');
    expect(channelsRequest.request.method).toBe('GET');
    channelsRequest.flush({
      channels: [
        { id: 'C123', name: 'general' },
        { id: 'C456', name: 'engineering' },
      ],
    });

    expect(result.connected).toBeTrue();
    expect(result.workspaceName).toBe('Sentinent Ops');
    expect(result.channels[0].isConnected).toBeTrue();
    expect(result.channels[1].isConnected).toBeFalse();
  });

  it('maps GitHub repositories using selected repo ids from integration metadata', () => {
    let repos: Array<{ isConnected: boolean }> = [];

    service.getGitHubRepos().subscribe((state) => {
      repos = state.repos;
    });

    const integrationsRequest = httpMock.expectOne('/api/integrations');
    expect(integrationsRequest.request.method).toBe('GET');
    integrationsRequest.flush([
      {
        id: 8,
        provider: 'github',
        metadata: JSON.stringify({
          selected_repo_ids: [101],
        }),
        updated_at: '2026-03-24T10:00:00Z',
      },
    ]);

    const reposRequest = httpMock.expectOne('/api/integrations/github/repos');
    expect(reposRequest.request.method).toBe('GET');
    reposRequest.flush([
      {
        id: 101,
        name: 'frontend-angular',
        full_name: 'Sentinent-AI/frontend-angular',
        owner: { login: 'Sentinent-AI' },
      },
      {
        id: 102,
        name: 'backend-go',
        full_name: 'Sentinent-AI/backend-go',
        owner: { login: 'Sentinent-AI' },
      },
    ]);

    expect(repos.length).toBe(2);
    expect(repos[0].isConnected).toBeTrue();
    expect(repos[1].isConnected).toBeFalse();
  });

  it('maps Gmail connection metadata from integrations', () => {
    let connection: any;

    service.getGmailConnection().subscribe((state) => {
      connection = state;
    });

    const integrationsRequest = httpMock.expectOne('/api/integrations');
    expect(integrationsRequest.request.method).toBe('GET');
    integrationsRequest.flush([
      {
        id: 12,
        provider: 'gmail',
        metadata: JSON.stringify({
          email: 'alerts@example.com',
          name: 'Team Inbox',
        }),
        updated_at: '2026-03-24T10:00:00Z',
      },
    ]);

    expect(connection.connected).toBeTrue();
    expect(connection.email).toBe('alerts@example.com');
    expect(connection.name).toBe('Team Inbox');
  });

  it('persists GitHub repository selections through the backend API', () => {
    service.updateGitHubRepos([101, 103]).subscribe();

    const request = httpMock.expectOne('/api/integrations/github/repos');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ repo_ids: [101, 103] });
    request.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('maps GitHub sync start responses into UI sync state', () => {
    let status = '';

    service.syncGitHub().subscribe((result) => {
      status = result.status;
    });

    const request = httpMock.expectOne('/api/integrations/github/sync');
    expect(request.request.method).toBe('POST');
    request.flush({ status: 'sync_started' });

    expect(status).toBe('in_progress');
  });

  it('disconnects Gmail through the backend API', () => {
    service.disconnectGmail().subscribe();

    const request = httpMock.expectOne('/api/integrations/gmail');
    expect(request.request.method).toBe('DELETE');
    request.flush(null, { status: 200, statusText: 'OK' });
  });
});
