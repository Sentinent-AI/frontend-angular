import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DecisionListComponent } from './decision-list.component';
import { DecisionService } from '../../services/decision.service';
import { of } from 'rxjs';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { Decision } from '../../models/decision.model';
import { By } from '@angular/platform-browser';

describe('DecisionListComponent', () => {
    let component: DecisionListComponent;
    let fixture: ComponentFixture<DecisionListComponent>;
    let mockDecisionService: any;

    const mockDecisions: Decision[] = [
        {
            id: '1',
            workspaceId: '10',
            userId: '3',
            title: 'Test Decision',
            description: 'Test Description',
            status: 'OPEN',
            createdAt: new Date(),
            updatedAt: new Date(),
            isDeleted: false
        }
    ];

    beforeEach(async () => {
        mockDecisionService = {
            getDecisions: jasmine.createSpy('getDecisions').and.returnValue(of(mockDecisions)),
            deleteDecision: jasmine.createSpy('deleteDecision').and.returnValue(of(void 0))
        };

        await TestBed.configureTestingModule({
            imports: [DecisionListComponent, RouterTestingModule],
            providers: [
                { provide: DecisionService, useValue: mockDecisionService },
                {
                    provide: ActivatedRoute,
                    useValue: {
                        pathFromRoot: [
                            { snapshot: { paramMap: { get: () => '10' } } }
                        ]
                    }
                }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(DecisionListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should render an edit button for each decision', () => {
        const compiled = fixture.nativeElement as HTMLElement;
        const editButtons = compiled.querySelectorAll('.btn-secondary');
        expect(editButtons.length).toBe(1);
        expect(editButtons[0].textContent).toContain('Edit');
    });

    it('should have correct edit link', () => {
        const editButton = fixture.debugElement.query(By.css('.btn-secondary'));
        expect(editButton).toBeTruthy();
        const link = editButton.nativeElement as HTMLAnchorElement;
        expect(link.textContent).toContain('Edit');
    });

    // ── Delete modal flow ────────────────────────────────────────────────────

    it('should not show delete modal by default', () => {
        const backdrop = fixture.nativeElement.querySelector('.modal-backdrop');
        expect(backdrop).toBeNull();
    });

    it('should open delete modal with decision title when requestDeleteDecision is called', () => {
        component.requestDeleteDecision(mockDecisions[0]);
        fixture.detectChanges();

        const backdrop = fixture.nativeElement.querySelector('.modal-backdrop');
        expect(backdrop).toBeTruthy();

        const title = fixture.nativeElement.querySelector('.delete-modal-title');
        expect(title.textContent).toContain('Test Decision');
    });

    it('should close modal and clear state when cancelDeleteDecision is called', () => {
        component.requestDeleteDecision(mockDecisions[0]);
        fixture.detectChanges();

        component.cancelDeleteDecision();
        fixture.detectChanges();

        const backdrop = fixture.nativeElement.querySelector('.modal-backdrop');
        expect(backdrop).toBeNull();
        expect(component.pendingDeleteDecision).toBeNull();
        expect(component.deleteDecisionError).toBe('');
    });

    it('should close modal when backdrop overlay is clicked', () => {
        component.requestDeleteDecision(mockDecisions[0]);
        fixture.detectChanges();

        const backdrop = fixture.nativeElement.querySelector('.modal-backdrop') as HTMLElement;
        backdrop.click();
        fixture.detectChanges();

        expect(component.pendingDeleteDecision).toBeNull();
    });

    it('should call deleteDecision service and close modal on confirmDeleteDecision', () => {
        component.requestDeleteDecision(mockDecisions[0]);
        fixture.detectChanges();

        component.confirmDeleteDecision();
        fixture.detectChanges();

        expect(mockDecisionService.deleteDecision).toHaveBeenCalledWith('10', '1');
        expect(component.pendingDeleteDecision).toBeNull();
        expect(component.isDeletingDecision).toBeFalse();
    });

    it('should not open modal while a delete is already in progress', () => {
        component.isDeletingDecision = true;
        component.requestDeleteDecision(mockDecisions[0]);

        expect(component.pendingDeleteDecision).toBeNull();
    });

    it('should not close modal while a delete is in progress', () => {
        component.requestDeleteDecision(mockDecisions[0]);
        component.isDeletingDecision = true;
        component.cancelDeleteDecision();

        expect(component.pendingDeleteDecision).toEqual(mockDecisions[0]);
    });
});
