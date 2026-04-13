import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Dashboard } from './dashboard';
import { WorkspaceService } from '../../services/workspace';
import { AuthService } from '../../services/auth';
import { of } from 'rxjs';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { SignalService } from '../../services/signal.service';

describe('Dashboard', () => {
    let component: Dashboard;
    let fixture: ComponentFixture<Dashboard>;
    let mockWorkspaceService: any;
    let mockAuthService: any;
    let mockSignalService: any;
    let router: Router;

    beforeEach(async () => {
        mockWorkspaceService = {
            getWorkspaces: jasmine.createSpy('getWorkspaces').and.returnValue(of([
                { id: '1', name: 'Test Workspace', description: 'Test Desc', createdDate: new Date(), ownerId: 'u1' }
            ])),
            deleteWorkspace: jasmine.createSpy('deleteWorkspace').and.returnValue(of(true))
        };

        mockAuthService = {
            logout: jasmine.createSpy('logout'),
            getCurrentUserId: jasmine.createSpy('getCurrentUserId').and.returnValue('u1')
        };

        mockSignalService = {
            getSignals: jasmine.createSpy('getSignals').and.returnValue(of([
                {
                    id: 'slack-1',
                    sourceType: 'slack',
                    sourceId: 'C123456',
                    externalId: '1',
                    title: 'Test Slack Signal',
                    content: 'Slack signal content',
                    author: '@ops',
                    status: 'unread',
                    receivedAt: new Date(),
                    metadata: {
                        channel: 'general',
                        channelId: 'C123456'
                    }
                },
                {
                    id: 'github-1',
                    sourceType: 'github',
                    sourceId: 'Sentinent-AI/frontend-angular',
                    externalId: '10',
                    title: 'Test GitHub Signal',
                    content: 'Signal content',
                    author: '@tester',
                    status: 'unread',
                    receivedAt: new Date(),
                    metadata: {
                        type: 'issue',
                        number: 10,
                        repository: 'Sentinent-AI/frontend-angular',
                        state: 'open',
                        labels: ['frontend'],
                        assignees: ['@tester']
                    }
                }
            ])),
            markAsRead: jasmine.createSpy('markAsRead').and.returnValue(of(void 0)),
            archive: jasmine.createSpy('archive').and.returnValue(of(void 0))
        };

        await TestBed.configureTestingModule({
            imports: [Dashboard, RouterTestingModule],
            providers: [
                { provide: WorkspaceService, useValue: mockWorkspaceService },
                { provide: AuthService, useValue: mockAuthService },
                { provide: SignalService, useValue: mockSignalService }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(Dashboard);
        component = fixture.componentInstance;
        router = TestBed.inject(Router);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should render workspaces', () => {
        const compiled = fixture.nativeElement as HTMLElement;
        expect(compiled.querySelector('.workspace-card h3')?.textContent).toContain('Test Workspace');
    });

    it('should show edit action for all workspace cards', () => {
        mockWorkspaceService.getWorkspaces.and.returnValue(of([
            { id: '1', name: 'Owned Workspace', description: 'Owned Desc', createdDate: new Date(), ownerId: 'u1' },
            { id: '2', name: 'Shared Workspace', description: 'Shared Desc', createdDate: new Date(), ownerId: 'u2' }
        ]));

        fixture = TestBed.createComponent(Dashboard);
        component = fixture.componentInstance;
        fixture.detectChanges();

        const cards = Array.from(fixture.nativeElement.querySelectorAll('.workspace-card')) as HTMLElement[];
        const ownedCard = cards.find(card => card.textContent?.includes('Owned Workspace'));
        const sharedCard = cards.find(card => card.textContent?.includes('Shared Workspace'));

        expect(ownedCard?.textContent).toContain('Edit');
        expect(sharedCard?.textContent).toContain('Edit');
    });

    it('should call logout on button click', () => {
        const button = fixture.nativeElement.querySelector('.logout-btn');
        button.click();
        expect(mockAuthService.logout).toHaveBeenCalled();
    });

    it('should render github signals', () => {
        const compiled = fixture.nativeElement as HTMLElement;
        expect(compiled.textContent).toContain('Test GitHub Signal');
    });

    it('should render slack filter and signals', () => {
        const compiled = fixture.nativeElement as HTMLElement;
        expect(compiled.textContent).toContain('Slack');
        expect(compiled.textContent).toContain('Test Slack Signal');
    });

    it('should render jira source filter', () => {
        const compiled = fixture.nativeElement as HTMLElement;
        expect(compiled.textContent).toContain('JIRA');
    });

    it('should open custom delete dialog from workspace card', () => {
        const deleteButton = fixture.nativeElement.querySelector('.delete-btn') as HTMLButtonElement;
        deleteButton.click();
        fixture.detectChanges();

        const dialog = fixture.nativeElement.querySelector('.delete-modal') as HTMLElement | null;
        expect(dialog).not.toBeNull();
        expect(dialog?.textContent).toContain('Delete "Test Workspace"?');
    });

    it('should delete workspace via custom dialog and remove it from list', () => {
        component.requestDeleteWorkspace(component.workspaces[0]);
        component.confirmDeleteWorkspace();
        fixture.detectChanges();

        expect(mockWorkspaceService.deleteWorkspace).toHaveBeenCalledWith('1');
        expect(component.workspaces.length).toBe(0);
        expect(component.pendingDeleteWorkspace).toBeNull();
    });
});
