import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { WorkspaceService } from '../../services/workspace';

@Component({
  selector: 'app-edit-workspace',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './edit-workspace.html',
  styleUrls: ['./edit-workspace.css']
})
export class EditWorkspaceComponent implements OnInit {
  workspaceId: string | null = null;
  name = '';
  description = '';
  error = '';
  isSubmitting = false;
  isLoading = true;

  private workspaceService = inject(WorkspaceService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.workspaceId = params.get('id');
      if (this.workspaceId) {
        this.loadWorkspace(this.workspaceId);
      } else {
        this.router.navigate(['/dashboard']);
      }
    });
  }

  loadWorkspace(id: string): void {
    this.workspaceService.getWorkspace(id).subscribe(workspace => {
      this.isLoading = false;
      if (workspace) {
        this.name = workspace.name;
        this.description = workspace.description || '';
      } else {
        this.error = 'Workspace not found';
      }
    });
  }

  onSubmit() {
    const trimmedName = this.name.trim();
    if (!trimmedName || !this.workspaceId) {
      this.error = 'Workspace name is required.';
      return;
    }

    this.isSubmitting = true;
    this.error = '';

    this.workspaceService.updateWorkspace(this.workspaceId, trimmedName, this.description.trim()).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: () => {
        this.error = 'Unable to update workspace. Please try again.';
        this.isSubmitting = false;
      }
    });
  }
}
