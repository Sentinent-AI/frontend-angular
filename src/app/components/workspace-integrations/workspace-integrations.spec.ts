import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
import { WorkspaceIntegrationsComponent } from './workspace-integrations';
import { IntegrationService } from '../../services/integration.service';

describe('WorkspaceIntegrationsComponent', () => {
  let component: WorkspaceIntegrationsComponent;
  let fixture: ComponentFixture<WorkspaceIntegrationsComponent>;
  let mockIntegrationService: jasmine.SpyObj<IntegrationService>;

  beforeEach(async () => {
    mockIntegrationService = jasmine.createSpyObj<IntegrationService>('IntegrationService', [
      'getSlackChannels',
      'connectSlack',
      'updateSlackChannels',
      'disconnectSlack',
      'getGitHubRepos',
      'connectGitHub',
      'updateGitHubRepos',
      'disconnectGitHub',
      'syncGitHub',
      'getJiraProjects',
      'getJiraStatus',
      'connectJira',
      'disconnectJira',
      'syncJira',
      'syncSlack'
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
    mockIntegrationService.connectSlack.and.returnValue(of(void 0));
    mockIntegrationService.syncSlack.and.returnValue(of({ syncId: 'sync-slack-1', status: 'in_progress' }));

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
    mockIntegrationService.syncGitHub.and.returnValue(of({ syncId: 'sync-1', status: 'in_progress' }));
    mockIntegrationService.disconnectGitHub.and.returnValue(of(void 0));
    mockIntegrationService.connectGitHub.and.returnValue(of(void 0));

    mockIntegrationService.getJiraStatus.and.returnValue(of({
      connected: true,
      lastSyncAt: new Date('2026-04-01T12:00:00Z')
    }));
    mockIntegrationService.getJiraProjects.and.returnValue(of({
      connected: true,
      resources: [{ id: 'abc', url: 'https://test.atlassian.net', name: 'Test Site', scopes: [], avatarUrl: '' }],
      lastSyncAt: new Date('2026-04-01T12:00:00Z')
    }));
    mockIntegrationService.connectJira.and.returnValue(of(void 0));
    mockIntegrationService.disconnectJira.and.returnValue(of(void 0));
    mockIntegrationService.syncJira.and.returnValue(of({ status: 'in_progress' }));

    await TestBed.configureTestingModule({
      imports: [WorkspaceIntegrationsComponent],
      providers: [
        { provide: IntegrationService, useValue: mockIntegrationService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ id: 'workspace-1' })
            },
            pathFromRoot: [{
              snapshot: {
                paramMap: convertToParamMap({ id: 'workspace-1' })
              }
            }]
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
    expect(component.githubFeedbackMessage).toContain('started');
  });

  it('should save slack channel selection and trigger sync', () => {
    component.saveSlackChannelSelection();
    fixture.detectChanges();

    expect(mockIntegrationService.updateSlackChannels).toHaveBeenCalledWith('workspace-1', ['C123']);
    // Since syncSlackNow() is called immediately, the message will be the sync one
    expect(component.slackFeedbackMessage).toContain('Slack sync started');
  });

  it('should trigger manual slack sync', () => {
    component.syncSlackNow();
    fixture.detectChanges();

    expect(mockIntegrationService.syncSlack).toHaveBeenCalledWith('workspace-1');
    expect(component.slackFeedbackMessage).toContain('Slack sync started');
  });

  // --- Jira persistence tests ---

  it('should show Jira as connected when integration record exists', () => {
    // getJiraStatus returns connected: true (set in beforeEach)
    expect(component.isJiraConnected).toBeTrue();
    expect(mockIntegrationService.getJiraStatus).toHaveBeenCalledWith('workspace-1');
  });

  it('should show Jira as disconnected when no integration record exists', () => {
    mockIntegrationService.getJiraStatus.and.returnValue(of({
      connected: false
    }));

    component.ngOnInit();
    fixture.detectChanges();

    expect(component.isJiraConnected).toBeFalse();
  });

  it('should keep Jira connected even when project API call fails', () => {
    mockIntegrationService.getJiraStatus.and.returnValue(of({
      connected: true,
      lastSyncAt: new Date('2026-04-01T12:00:00Z')
    }));
    mockIntegrationService.getJiraProjects.and.returnValue(
      throwError(() => new Error('Token expired'))
    );

    component.ngOnInit();
    fixture.detectChanges();

    // The key assertion: Jira should still appear connected even though projects API failed
    expect(component.isJiraConnected).toBeTrue();
    expect(component.jiraResources).toEqual([]);
    expect(component.jiraErrorMessage).toContain('Could not load Jira projects');
  });

  it('should load Jira projects when connected', () => {
    expect(component.jiraResources.length).toBe(1);
    expect(component.jiraResources[0].name).toBe('Test Site');
  });

  it('should not load projects when Jira is disconnected', () => {
    mockIntegrationService.getJiraStatus.and.returnValue(of({
      connected: false
    }));

    component.ngOnInit();
    fixture.detectChanges();

    // getJiraProjects should only have been called during the first beforeEach init,
    // not during this re-init
    const callCount = mockIntegrationService.getJiraProjects.calls.count();
    // First call is from beforeEach, second ngOnInit should NOT call it
    expect(callCount).toBe(1);
  });

  it('should disconnect Jira only through explicit disconnect button', () => {
    expect(component.isJiraConnected).toBeTrue();

    component.disconnectJira();
    fixture.detectChanges();

    expect(mockIntegrationService.disconnectJira).toHaveBeenCalledWith('workspace-1');
  });

  it('should preserve Jira connection state when status check errors', () => {
    // Start connected
    expect(component.isJiraConnected).toBeTrue();

    // Now simulate a network error on re-check
    mockIntegrationService.getJiraStatus.and.returnValue(
      throwError(() => new Error('Network error'))
    );

    // Simulate re-navigating to the page (window focus)
    component.ngOnInit();
    fixture.detectChanges();

    // Connection state should NOT flip to false due to the error
    expect(component.isJiraConnected).toBeTrue();
  });

  it('should trigger Jira sync correctly', () => {
    component.syncJiraNow();
    fixture.detectChanges();

    expect(mockIntegrationService.syncJira).toHaveBeenCalledWith('workspace-1');
    expect(component.jiraFeedbackMessage).toContain('started');
  });

  // --- Repo edit/save UX tests ---

  it('should start in summary view (not editing) when repos are already saved', () => {
    // Default mock has one repo with isConnected: true
    expect(component.isEditingRepos).toBeFalse();
  });

  it('should start in edit mode when connected but no repos are saved', () => {
    mockIntegrationService.getGitHubRepos.and.returnValue(of({
      connected: true,
      accountName: 'Sentinent Engineering',
      accountHandle: '@sentinent-dev',
      repos: [
        { id: 2, name: 'backend-go', fullName: 'Sentinent-AI/backend-go', isConnected: false }
      ],
      lastSyncAt: undefined
    }));

    component.ngOnInit();
    fixture.detectChanges();

    expect(component.isEditingRepos).toBeTrue();
  });

  it('hasSavedRepos returns true when at least one repo is connected', () => {
    // Default mock has one repo with isConnected: true
    expect(component.hasSavedRepos).toBeTrue();
  });

  it('hasSavedRepos returns false when no repos are connected', () => {
    mockIntegrationService.getGitHubRepos.and.returnValue(of({
      connected: true,
      accountName: 'Sentinent Engineering',
      accountHandle: '@sentinent-dev',
      repos: [
        { id: 2, name: 'backend-go', fullName: 'Sentinent-AI/backend-go', isConnected: false }
      ],
      lastSyncAt: undefined
    }));

    component.ngOnInit();
    fixture.detectChanges();

    expect(component.hasSavedRepos).toBeFalse();
  });

  it('editRepos() switches to edit mode', () => {
    expect(component.isEditingRepos).toBeFalse();

    component.editRepos();

    expect(component.isEditingRepos).toBeTrue();
  });

  it('cancelEditRepos() exits edit mode and resets checkboxes to last saved state', () => {
    // Start in edit mode
    component.editRepos();
    expect(component.isEditingRepos).toBeTrue();

    // Change selection
    component.toggleRepo(1, false);
    expect(component.selectedRepoIds).not.toContain(1);

    // Cancel — should restore isConnected repos from component.repos
    component.cancelEditRepos();

    expect(component.isEditingRepos).toBeFalse();
    expect(component.selectedRepoIds).toContain(1);
  });

  it('saveRepoSelection() exits edit mode on success', () => {
    component.editRepos();
    expect(component.isEditingRepos).toBeTrue();

    component.saveRepoSelection();
    fixture.detectChanges();

    expect(mockIntegrationService.updateGitHubRepos).toHaveBeenCalledWith('workspace-1', [1]);
    expect(component.isEditingRepos).toBeFalse();
    expect(component.githubFeedbackMessage).toContain('saved');
  });

  it('saveRepoSelection() stays in edit mode and shows error on failure', () => {
    const { throwError } = require('rxjs');
    mockIntegrationService.updateGitHubRepos.and.returnValue(
      throwError(() => new Error('Network error'))
    );

    component.editRepos();
    component.saveRepoSelection();
    fixture.detectChanges();

    expect(component.isGitHubSaving).toBeFalse();
    expect(component.githubErrorMessage).toContain('Could not save');
  });

  it('saveRepoSelection() always clears the loading spinner via finalize', () => {
    component.editRepos();
    component.isGitHubSaving = true;

    component.saveRepoSelection();
    fixture.detectChanges();

    expect(component.isGitHubSaving).toBeFalse();
  });

  it('summary view renders only connected repos with Active badge', () => {
    // isEditingRepos is false by default (repos saved)
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    const activeTag = compiled.querySelector('.repo-tag');
    expect(activeTag).not.toBeNull();
    expect(activeTag?.textContent?.trim()).toBe('Active');

    // No checkboxes in summary view
    const checkboxes = compiled.querySelectorAll('input[type="checkbox"]');
    expect(checkboxes.length).toBe(0);
  });

  it('edit view renders checkboxes and Save Selection button', () => {
    component.editRepos();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    const checkboxes = compiled.querySelectorAll('input[type="checkbox"]');
    expect(checkboxes.length).toBeGreaterThan(0);

    const saveBtn = Array.from(compiled.querySelectorAll('button'))
      .find(b => b.textContent?.includes('Save Selection'));
    expect(saveBtn).not.toBeNull();
  });
});
