import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Decision } from '../../models/decision.model';
import { DecisionService } from '../../services/decision.service';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-decision-list',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './decision-list.component.html',
    styleUrls: ['./decision-list.component.css']
})
export class DecisionListComponent implements OnInit {
    decisions$: Observable<Decision[]> | undefined;
    private workspaceId: string | null = null;

    constructor(
        private decisionService: DecisionService,
        private route: ActivatedRoute
    ) { }

    ngOnInit(): void {
        this.workspaceId = this.getWorkspaceIdFromRoute();
        if (this.workspaceId) {
            this.decisions$ = this.decisionService.getDecisions(this.workspaceId);
        }
    }

    deleteDecision(id: string): void {
        if (confirm('Are you sure you want to delete this decision?') && this.workspaceId) {
            this.decisionService.deleteDecision(this.workspaceId, id).subscribe(() => {
                this.decisions$ = this.decisionService.getDecisions(this.workspaceId!);
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
