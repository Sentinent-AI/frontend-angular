import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Dashboard } from './dashboard';
import { WorkspaceService } from '../../services/workspace';
import { AuthService } from '../../services/auth';
import { of } from 'rxjs';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';

describe('Dashboard', () => {
    let component: Dashboard;
    let fixture: ComponentFixture<Dashboard>;
    let mockWorkspaceService: any;
    let mockAuthService: any;
    let router: Router;

    beforeEach(async () => {
        mockWorkspaceService = {
            getWorkspaces: jasmine.createSpy('getWorkspaces').and.returnValue(of([
                { id: '1', name: 'Test Workspace', description: 'Test Desc', createdDate: new Date(), ownerId: 'u1' }
            ]))
        };

        mockAuthService = {
            logout: jasmine.createSpy('logout')
        };

        await TestBed.configureTestingModule({
            imports: [Dashboard, RouterTestingModule],
            providers: [
                { provide: WorkspaceService, useValue: mockWorkspaceService },
                { provide: AuthService, useValue: mockAuthService }
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

    it('should call logout on button click', () => {
        const button = fixture.nativeElement.querySelector('.logout-btn');
        button.click();
        expect(mockAuthService.logout).toHaveBeenCalled();
    });
});
