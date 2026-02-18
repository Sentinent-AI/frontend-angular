import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DecisionService } from '../../services/decision.service';
import { Decision } from '../../models/decision.model';

@Component({
    selector: 'app-decision-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './decision-form.component.html',
    styleUrls: ['./decision-form.component.css']
})
export class DecisionFormComponent implements OnInit {
    decisionForm: FormGroup;
    isEditMode = false;
    decisionId: string | null = null;
    isLoading = false;

    constructor(
        private fb: FormBuilder,
        private decisionService: DecisionService,
        private route: ActivatedRoute,
        private router: Router
    ) {
        this.decisionForm = this.fb.group({
            title: ['', Validators.required],
            description: [''],
            status: ['DRAFT', Validators.required]
        });
    }

    ngOnInit(): void {
        // Get workspaceId from parent
        this.route.parent?.paramMap.subscribe(params => {
            const workspaceId = params.get('id');
            if (workspaceId) {
                this.decisionForm.patchValue({ workspaceId });
            }
        });

        // Get decisionId from current route
        this.route.paramMap.subscribe(params => {
            this.decisionId = params.get('decisionId');
            if (this.decisionId) {
                this.isEditMode = true;
                this.loadDecision(this.decisionId);
            }
        });
    }

    loadDecision(id: string): void {
        this.isLoading = true;
        this.decisionService.getDecision(id).subscribe(decision => {
            this.isLoading = false;
            if (decision) {
                this.decisionForm.patchValue({
                    title: decision.title,
                    description: decision.description,
                    status: decision.status
                });
            } else {
                this.router.navigate(['../'], { relativeTo: this.route });
            }
        });
    }

    onSubmit(): void {
        if (this.decisionForm.invalid) {
            return;
        }

        const formValue = this.decisionForm.value;

        if (this.isEditMode && this.decisionId) {
            this.decisionService.updateDecision(this.decisionId, formValue).subscribe(() => {
                this.router.navigate(['../../'], { relativeTo: this.route });
            });
        } else {
            // Include workspaceId from parent route if available
            const workspaceId = this.route.parent?.snapshot.paramMap.get('id');
            this.decisionService.createDecision({ ...formValue, workspaceId }).subscribe(() => {
                this.router.navigate(['../'], { relativeTo: this.route });
            });
        }
    }
}
