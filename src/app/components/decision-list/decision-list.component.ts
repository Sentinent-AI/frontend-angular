import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Decision } from '../../models/decision.model';
import { DecisionService } from '../../services/decision.service';
import { Observable, Subject, takeUntil, startWith, switchMap, catchError, of } from 'rxjs';

@Component({
    selector: 'app-decision-list',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './decision-list.component.html',
    styleUrls: ['./decision-list.component.css']
})
export class DecisionListComponent implements OnInit, OnDestroy {
    decisions$: Observable<Decision[]> | undefined;
    error: string | null = null;
    private refresh$ = new Subject<void>();
    private destroy$ = new Subject<void>();
    private workspaceId: string | null = null;

    constructor(
        private decisionService: DecisionService,
        private route: ActivatedRoute
    ) { }

    ngOnInit(): void {
        this.workspaceId = this.getWorkspaceIdFromRoute();
        if (this.workspaceId) {
            this.decisions$ = this.refresh$.pipe(
                startWith(undefined),
                switchMap(() => this.decisionService.getDecisions(this.workspaceId!).pipe(
                    catchError(err => {
                        this.error = 'Failed to load decisions. Please try again.';
                        return of([]);
                    })
                ))
            );
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    deleteDecision(id: string): void {
        if (confirm('Are you sure you want to delete this decision?') && this.workspaceId) {
            this.error = null;
            this.decisionService.deleteDecision(this.workspaceId, id)
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                    next: () => {
                        this.refresh$.next();
                    },
                    error: (err) => {
                        console.error('Delete failed', err);
                        this.error = 'Failed to delete decision. Please try again.';
                    }
                });
        }
    }

    isOverdue(decision: Decision): boolean {
        if (!decision.dueDate || decision.status === 'CLOSED') {
            return false;
        }
        return new Date(decision.dueDate) < new Date();
    }

    private getWorkspaceIdFromRoute(): string | null {
        for (const route of this.route.pathFromRoot) {
            const id = route.snapshot.paramMap.get('id');
            if (id) {
                return id;
            }
        }
        return null;
    }
}
