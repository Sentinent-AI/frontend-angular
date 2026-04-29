import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { WorkspaceService } from '../../services/workspace';
import { Workspace } from '../../models/workspace';
import { WorkspaceIntegrationsComponent } from '../workspace-integrations/workspace-integrations';
import { AppNavComponent } from '../app-nav/app-nav';

@Component({
  selector: 'app-integrations-page',
  standalone: true,
  imports: [CommonModule, RouterLink, WorkspaceIntegrationsComponent, AppNavComponent],
  templateUrl: './integrations-page.html',
  styleUrl: './integrations-page.css',
})
export class IntegrationsPageComponent implements OnInit {
  private readonly workspaceService = inject(WorkspaceService);
  private readonly cdr = inject(ChangeDetectorRef);

  workspaces: Workspace[] = [];
  selectedWorkspaceId = '';
  isLoading = true;

  ngOnInit(): void {
    this.workspaceService.getWorkspaces().subscribe({
      next: (ws) => {
        this.workspaces = ws;
        if (ws.length > 0) {
          this.selectedWorkspaceId = String(ws[0].id);
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  selectWorkspace(id: string): void {
    this.selectedWorkspaceId = id;
    this.cdr.detectChanges();
  }
}
