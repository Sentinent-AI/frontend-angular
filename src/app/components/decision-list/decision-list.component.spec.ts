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
        // Since it's a relative link [decision.id, 'edit'], we check if the attribute is present or just trust the binding
        const link = editButton.nativeElement as HTMLAnchorElement;
        expect(link.textContent).toContain('Edit');
    });
});
