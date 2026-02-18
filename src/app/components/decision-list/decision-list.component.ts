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

    constructor(
        private decisionService: DecisionService,
        private route: ActivatedRoute
    ) { }

    ngOnInit(): void {
        // Get workspaceId from the parent route (workspaces/:id)
        this.route.parent?.paramMap.subscribe(params => {
            const workspaceId = params.get('id');
            if (workspaceId) {
                this.decisions$ = this.decisionService.getDecisions(workspaceId);
            }
        });
    }

    deleteDecision(id: string): void {
        if (confirm('Are you sure you want to delete this decision?')) {
            this.decisionService.deleteDecision(id);
        }
    }
}
