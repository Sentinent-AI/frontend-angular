import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { WorkspaceIntegrationsComponent } from './workspace-integrations';
import { IntegrationService } from '../../services/integration.service';

describe('WorkspaceIntegrationsComponent', () => {
  let component: WorkspaceIntegrationsComponent;
  let fixture: ComponentFixture<WorkspaceIntegrationsComponent>;
  let mockIntegrationService: jasmine.SpyObj<IntegrationService>;

  beforeEach(async () => {
    mockIntegrationService = jasmine.createSpyObj<IntegrationService>('IntegrationService', [
      'getSlackAuthUrl',
      'getSlackChannels',
      'connectSlack',
      'updateSlackChannels',
      'disconnectSlack',
      'getGitHubAuthUrl',
      'getGitHubRepos',
      'connectGitHub',
      'updateGitHubRepos',
      'disconnectGitHub',
      'syncGitHub',
      'getSyncStatus'
    ]);

    mockIntegrationService.getSlackChannels.and.returnValue(of({
      connected: true,
      workspaceName: 'Sentinent Ops',
      workspaceUrl: 'sentinent.slack.com',
      channels: [
        { id: 'C123', name: 'general', isConnected: true }
      ],
      lastSyncAt: new Date('2026-03-24T09:00:00Z')
    }));
    mockIntegrationService.updateSlackChannels.and.returnValue(of(void 0));
    mockIntegrationService.disconnectSlack.and.returnValue(of(void 0));
    mockIntegrationService.getSlackAuthUrl.and.returnValue(of({ authUrl: 'https://slack.com/mock' }));
    mockIntegrationService.connectSlack.and.returnValue(of({ connected: true }));

    mockIntegrationService.getGitHubRepos.and.returnValue(of({
      connected: true,
      accountName: 'Sentinent Engineering',
      accountHandle: '@sentinent-dev',
      repos: [
        { id: 1, name: 'frontend-angular', fullName: 'Sentinent-AI/frontend-angular', isConnected: true }
      ],
      lastSyncAt: new Date('2026-03-23T10:00:00Z')
    }));
    mockIntegrationService.updateGitHubRepos.and.returnValue(of(void 0));
    mockIntegrationService.syncGitHub.and.returnValue(of({ syncId: 'sync-1' }));
    mockIntegrationService.getSyncStatus.and.returnValue(of({
      syncId: 'sync-1',
      status: 'completed',
      itemsSynced: 6,
      completedAt: new Date('2026-03-23T10:05:00Z')
    }));
    mockIntegrationService.disconnectGitHub.and.returnValue(of(void 0));
    mockIntegrationService.getGitHubAuthUrl.and.returnValue(of({ authUrl: 'https://github.com/mock' }));
    mockIntegrationService.connectGitHub.and.returnValue(of({ connected: true }));

    await TestBed.configureTestingModule({
      imports: [WorkspaceIntegrationsComponent],
      providers: [
        { provide: IntegrationService, useValue: mockIntegrationService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ id: 'workspace-1' })
            }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(WorkspaceIntegrationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render connected repository information', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('frontend-angular');
    expect(compiled.textContent).toContain('Sentinent Engineering');
    expect(compiled.textContent).toContain('Sentinent Ops');
    expect(compiled.textContent).toContain('general');
  });

  it('should trigger sync and show refreshed item count', () => {
    component.syncNow();
    fixture.detectChanges();

    expect(mockIntegrationService.syncGitHub).toHaveBeenCalled();
    expect(component.githubFeedbackMessage).toContain('6 items refreshed');
  });

  it('should save slack channel selection', () => {
    component.saveSlackChannelSelection();

    expect(mockIntegrationService.updateSlackChannels).toHaveBeenCalled();
    expect(component.slackFeedbackMessage).toContain('saved');
  });
});
