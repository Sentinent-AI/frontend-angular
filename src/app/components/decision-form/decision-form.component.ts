import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, Subscription, takeUntil, timeout } from 'rxjs';
import { Decision } from '../../models/decision.model';
import { DecisionService } from '../../services/decision.service';

@Component({
    selector: 'app-decision-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './decision-form.component.html',
    styleUrls: ['./decision-form.component.css']
})
export class DecisionFormComponent implements OnInit, OnDestroy {
    private static readonly LOAD_GUARD_TIMEOUT_MS = 12000;

    decisionForm: FormGroup;
    isEditMode = false;
    decisionId: string | null = null;
    isLoading = false;
    isSubmitting = false;
    workspaceId: string | null = null;
    submitError = '';
    activeField: 'title' | 'description' | 'dueDate' | '' = '';
    readonly titleMaxLength = 90;
    readonly descriptionMaxLength = 360;
    readonly requestTimeoutMs = 10000;
    readonly titleSuggestions = [
        'Finalize Q2 onboarding workflow',
        'Approve incident response runbook',
        'Set customer escalation policy'
    ];
    readonly descriptionSuggestions = [
        'Align teams on the final approach and decision timeline.',
        'Capture tradeoffs, ownership, and rollout steps clearly.',
        'Document decision context for future audits and reviews.'
    ];
    readonly statusOptions: Array<{ value: Decision['status']; label: string; hint: string }> = [
        { value: 'DRAFT', label: 'Draft', hint: 'Still shaping direction' },
        { value: 'OPEN', label: 'Open', hint: 'Needs decision or review' },
        { value: 'CLOSED', label: 'Closed', hint: 'Finalized and recorded' }
    ];

    private readonly destroy$ = new Subject<void>();
    private loadSubscription?: Subscription;
    private loadGuardTimeoutId?: ReturnType<typeof setTimeout>;

    constructor(
        private readonly fb: FormBuilder,
        private readonly decisionService: DecisionService,
        private readonly route: ActivatedRoute,
        private readonly router: Router
    ) {
        this.decisionForm = this.fb.group({
            title: ['', [Validators.required, Validators.maxLength(this.titleMaxLength)]],
            description: ['', [Validators.maxLength(this.descriptionMaxLength)]],
            status: ['DRAFT', Validators.required],
            dueDate: ['']
        });
    }

    get titleLength(): number {
        return (this.decisionForm.get('title')?.value ?? '').trim().length;
    }

    get descriptionLength(): number {
        return (this.decisionForm.get('description')?.value ?? '').trim().length;
    }

    get trimmedTitle(): string {
        return (this.decisionForm.get('title')?.value ?? '').trim();
    }

    get trimmedDescription(): string {
        return (this.decisionForm.get('description')?.value ?? '').trim();
    }

    get selectedStatus(): Decision['status'] {
        return (this.decisionForm.get('status')?.value ?? 'DRAFT') as Decision['status'];
    }

    get dueDateText(): string {
        const raw = this.decisionForm.get('dueDate')?.value;
        if (!raw) {
            return 'No due date set';
        }

        const parsed = new Date(raw);
        if (Number.isNaN(parsed.getTime())) {
            return 'No due date set';
        }

        return parsed.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }

    get completionPercent(): number {
        let progress = 20;
        if (this.trimmedTitle.length > 0) {
            progress += 45;
        }
        if (this.trimmedDescription.length >= 20) {
            progress += 20;
        } else if (this.trimmedDescription.length > 0) {
            progress += 10;
        }
        if (this.decisionForm.get('dueDate')?.value) {
            progress += 15;
        }
        return Math.min(progress, 100);
    }

    ngOnInit(): void {
        this.workspaceId = this.resolveWorkspaceId();
        if (!this.workspaceId) {
            this.submitError = 'Workspace context is missing. Please open this page from a workspace.';
        }

        this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
            const nextDecisionId = params.get('decisionId');
            if (nextDecisionId) {
                this.enterEditMode(nextDecisionId);
            } else {
                this.enterCreateMode();
            }
        });
    }

    ngOnDestroy(): void {
        this.clearActiveLoad();
        this.destroy$.next();
        this.destroy$.complete();
    }

    applyTitleSuggestion(title: string): void {
        if (this.isSubmitting || this.isLoading) {
            return;
        }
        this.decisionForm.patchValue({ title });
        this.submitError = '';
    }

    applyDescriptionSuggestion(description: string): void {
        if (this.isSubmitting || this.isLoading) {
            return;
        }
        this.decisionForm.patchValue({ description });
        this.submitError = '';
    }

    selectStatus(status: Decision['status']): void {
        if (this.isSubmitting || this.isLoading) {
            return;
        }
        this.decisionForm.patchValue({ status });
    }

    onSubmit(): void {
        this.workspaceId = this.workspaceId ?? this.resolveWorkspaceId();
        if (this.decisionForm.invalid) {
            this.decisionForm.markAllAsTouched();
            return;
        }
        if (!this.workspaceId) {
            this.submitError = 'Workspace context is missing. Please reopen this page from a workspace.';
            return;
        }

        const payload = this.decisionForm.value as Partial<Decision>;
        this.submitError = '';
        this.isSubmitting = true;

        if (this.isEditMode && this.decisionId) {
            this.decisionService.updateDecision(this.workspaceId, this.decisionId, payload).pipe(
                timeout(this.requestTimeoutMs),
                takeUntil(this.destroy$),
            ).subscribe({
                next: (updated) => {
                    this.isSubmitting = false;
                    if (!updated) {
                        this.submitError = 'Decision not found.';
                        return;
                    }
                    this.navigateToDecisionList();
                },
                error: (error) => {
                    this.isSubmitting = false;
                    this.submitError = this.resolveSubmitError(error, 'Unable to update decision. Please try again.');
                }
            });
            return;
        }

        this.decisionService.createDecision({ ...payload, workspaceId: this.workspaceId }).pipe(
            timeout(this.requestTimeoutMs),
            takeUntil(this.destroy$),
        ).subscribe({
            next: () => {
                this.isSubmitting = false;
                this.navigateToDecisionList();
            },
            error: (error) => {
                this.isSubmitting = false;
                this.submitError = this.resolveSubmitError(error, 'Unable to create decision. Please try again.');
            }
        });
    }

    private enterCreateMode(): void {
        this.isEditMode = false;
        this.decisionId = null;
        this.isLoading = false;
        this.submitError = '';
        this.decisionForm.reset({
            title: '',
            description: '',
            status: 'DRAFT',
            dueDate: ''
        }, { emitEvent: false });
    }

    private enterEditMode(id: string): void {
        if (!/^\d+$/.test(id)) {
            this.enterCreateMode();
            this.submitError = 'Invalid decision link.';
            return;
        }

        this.isEditMode = true;
        this.decisionId = id;
        this.loadDecision(id);
    }

    private loadDecision(id: string): void {
        this.workspaceId = this.workspaceId ?? this.resolveWorkspaceId();
        if (!this.workspaceId) {
            this.submitError = 'Workspace context is missing. Please reopen this decision from the workspace page.';
            return;
        }

        this.clearActiveLoad();
        this.isLoading = true;
        this.submitError = '';
        this.startLoadGuardTimer();

        this.loadSubscription = this.decisionService.getDecision(this.workspaceId, id).pipe(
            timeout(this.requestTimeoutMs),
            takeUntil(this.destroy$),
        ).subscribe({
            next: (decision) => {
                this.clearActiveLoad();
                this.isLoading = false;
                if (!decision) {
                    this.submitError = 'Decision not found.';
                    return;
                }

                this.decisionForm.patchValue({
                    title: decision.title ?? '',
                    description: decision.description ?? '',
                    status: decision.status ?? 'DRAFT',
                    dueDate: this.toDateInputValue(decision.dueDate)
                });
            },
            error: (error) => {
                this.clearActiveLoad();
                this.isLoading = false;
                this.submitError = this.resolveSubmitError(error, 'Unable to load decision. Please try again.');
            }
        });
    }

    private navigateToDecisionList(): void {
        if (!this.workspaceId) {
            return;
        }
        void this.router.navigate(['/workspaces', this.workspaceId, 'decisions']);
    }

    private resolveWorkspaceId(): string | null {
        for (const route of this.route.pathFromRoot) {
            const id = route.snapshot.paramMap.get('id');
            if (id) {
                return id;
            }
        }

        const urlMatch = this.router.url.match(/\/workspaces\/([^/]+)/);
        if (urlMatch?.[1]) {
            return urlMatch[1];
        }

        return null;
    }

    private toDateInputValue(date?: Date): string {
        if (!date) {
            return '';
        }
        const parsed = date instanceof Date ? date : new Date(date);
        if (Number.isNaN(parsed.getTime())) {
            return '';
        }
        return parsed.toISOString().split('T')[0];
    }

    private resolveSubmitError(error: unknown, fallback: string): string {
        if (error && typeof error === 'object' && 'message' in error && typeof (error as { message?: unknown }).message === 'string') {
            const message = String((error as { message: string }).message).trim();
            if (message.length > 0) {
                if (message === 'Timeout has occurred') {
                    return 'Request timed out. Please check backend connectivity and try again.';
                }
                return message;
            }
        }
        return fallback;
    }

    private startLoadGuardTimer(): void {
        this.clearLoadGuardTimer();
        this.loadGuardTimeoutId = setTimeout(() => {
            this.loadSubscription?.unsubscribe();
            this.loadSubscription = undefined;
            this.isLoading = false;
            this.submitError = 'Loading decision is taking longer than expected. Please try again.';
        }, DecisionFormComponent.LOAD_GUARD_TIMEOUT_MS);
    }

    private clearLoadGuardTimer(): void {
        if (this.loadGuardTimeoutId === undefined) {
            return;
        }
        clearTimeout(this.loadGuardTimeoutId);
        this.loadGuardTimeoutId = undefined;
    }

    private clearActiveLoad(): void {
        this.loadSubscription?.unsubscribe();
        this.loadSubscription = undefined;
        this.clearLoadGuardTimer();
    }
}
