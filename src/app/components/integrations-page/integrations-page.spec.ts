import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { IntegrationsPageComponent } from './integrations-page';
import { WorkspaceService } from '../../services/workspace';
import { IntegrationService } from '../../services/integration.service';
import { SignalService } from '../../services/signal.service';

describe('IntegrationsPageComponent', () => {
  let component: IntegrationsPageComponent;
  let fixture: ComponentFixture<IntegrationsPageComponent>;
  let mockWorkspaceService: jasmine.SpyObj<WorkspaceService>;
  let mockIntegrationService: jasmine.SpyObj<IntegrationService>;
  let mockSignalService: jasmine.SpyObj<SignalService>;

  const twoWorkspaces = [
    { id: '1', name: 'Alpha Workspace', description: '', ownerId: '1', createdDate: new Date() },
    { id: '2', name: 'Beta Workspace',  description: '', ownerId: '1', createdDate: new Date() },
  ];

  const oneWorkspace = [twoWorkspaces[0]];

  beforeEach(async () => {
    mockWorkspaceService = jasmine.createSpyObj<WorkspaceService>('WorkspaceService', ['getWorkspaces']);
    mockWorkspaceService.getWorkspaces.and.returnValue(of(oneWorkspace));

    // IntegrationService is used by the embedded WorkspaceIntegrationsComponent
    mockIntegrationService = jasmine.createSpyObj<IntegrationService>('IntegrationService', [
      'getSlackChannels',
      'getGitHubRepos',
      'getJiraStatus',
      'getJiraProjects',
      'syncSlack',
      'syncGitHub',
      'syncJira',
      'connectSlack',
      'connectGitHub',
      'connectJira',
      'disconnectSlack',
      'disconnectGitHub',
      'disconnectJira',
      'updateSlackChannels',
      'updateGitHubRepos',
    ]);
    mockIntegrationService.getSlackChannels.and.returnValue(of({ connected: false, channels: [] }));
    mockIntegrationService.getGitHubRepos.and.returnValue(of({ connected: false, repos: [] }));
    mockIntegrationService.getJiraStatus.and.returnValue(of({ connected: false }));
    mockIntegrationService.getJiraProjects.and.returnValue(of({ connected: false, resources: [] }));

    mockSignalService = jasmine.createSpyObj<SignalService>('SignalService', ['getSignals']);
    mockSignalService.getSignals.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [IntegrationsPageComponent, RouterTestingModule],
      providers: [
        { provide: WorkspaceService,   useValue: mockWorkspaceService },
        { provide: IntegrationService, useValue: mockIntegrationService },
        { provide: SignalService,       useValue: mockSignalService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({}) },
            pathFromRoot: [{ snapshot: { paramMap: convertToParamMap({}) } }]
          }
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(IntegrationsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads workspaces on init and sets first workspace as selected', () => {
    expect(mockWorkspaceService.getWorkspaces).toHaveBeenCalled();
    expect(component.workspaces.length).toBe(1);
    expect(component.selectedWorkspaceId).toBe('1');
    expect(component.isLoading).toBeFalse();
  });

  it('renders the page heading', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Integrations');
  });

  it('renders the embedded WorkspaceIntegrationsComponent when workspace is loaded', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-workspace-integrations')).not.toBeNull();
  });

  it('shows the empty state when no workspaces exist', async () => {
    mockWorkspaceService.getWorkspaces.and.returnValue(of([]));

    fixture = TestBed.createComponent(IntegrationsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.workspaces.length).toBe(0);
    expect(component.selectedWorkspaceId).toBe('');
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('No workspace yet');
  });

  it('hides the workspace selector when only one workspace', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.workspace-select')).toBeNull();
  });

  it('shows the workspace selector when multiple workspaces exist', async () => {
    mockWorkspaceService.getWorkspaces.and.returnValue(of(twoWorkspaces));

    fixture = TestBed.createComponent(IntegrationsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.workspace-select')).not.toBeNull();
    const options = compiled.querySelectorAll('.workspace-select option');
    expect(options.length).toBe(2);
    expect(options[0].textContent?.trim()).toBe('Alpha Workspace');
    expect(options[1].textContent?.trim()).toBe('Beta Workspace');
  });

  it('selectWorkspace() updates the selected workspace id', () => {
    component.selectWorkspace('2');
    expect(component.selectedWorkspaceId).toBe('2');
  });

  it('handles workspace load error gracefully and stops loading', () => {
    mockWorkspaceService.getWorkspaces.and.returnValue(
      throwError(() => new Error('Server error'))
    );

    fixture = TestBed.createComponent(IntegrationsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.isLoading).toBeFalse();
    expect(component.workspaces.length).toBe(0);
  });
});
