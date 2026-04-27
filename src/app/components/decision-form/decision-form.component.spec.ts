import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DecisionFormComponent } from './decision-form.component';
import { DecisionService } from '../../services/decision.service';
import { of } from 'rxjs';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';

describe('DecisionFormComponent', () => {
    let component: DecisionFormComponent;
    let fixture: ComponentFixture<DecisionFormComponent>;
    let mockDecisionService: any;

    beforeEach(async () => {
        mockDecisionService = {
            getDecision: jasmine.createSpy('getDecision').and.returnValue(of({
                id: '1',
                title: 'Loaded Decision',
                description: 'Loaded Description',
                status: 'OPEN',
                workspaceId: '10'
            })),
            updateDecision: jasmine.createSpy('updateDecision').and.returnValue(of({
                id: '1',
                title: 'Updated Decision',
                status: 'CLOSED'
            })),
            createDecision: jasmine.createSpy('createDecision').and.returnValue(of({}))
        };

        await TestBed.configureTestingModule({
            imports: [DecisionFormComponent, RouterTestingModule, ReactiveFormsModule],
            providers: [
                { provide: DecisionService, useValue: mockDecisionService },
                {
                    provide: ActivatedRoute,
                    useValue: {
                        paramMap: of(convertToParamMap({ decisionId: '1' })),
                        snapshot: { paramMap: convertToParamMap({ id: '10' }) },
                        pathFromRoot: []
                    }
                }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(DecisionFormComponent);
        component = fixture.componentInstance;
        // Mock resolveWorkspaceId to return '10'
        spyOn<any>(component, 'resolveWorkspaceId').and.returnValue('10');
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should enter edit mode when decisionId is present', () => {
        expect(component.isEditMode).toBeTrue();
        expect(component.decisionId).toBe('1');
        expect(mockDecisionService.getDecision).toHaveBeenCalledWith('10', '1');
    });

    it('should populate form with decision data', () => {
        expect(component.decisionForm.value.title).toBe('Loaded Decision');
        expect(component.decisionForm.value.description).toBe('Loaded Description');
        expect(component.decisionForm.value.status).toBe('OPEN');
    });

    it('should call updateDecision on submit in edit mode', () => {
        component.decisionForm.patchValue({ title: 'Updated Title' });
        component.onSubmit();
        expect(mockDecisionService.updateDecision).toHaveBeenCalled();
    });
});
