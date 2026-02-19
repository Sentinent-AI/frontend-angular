import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { WorkspaceService } from '../../services/workspace';

@Component({
  selector: 'app-create-workspace',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './create-workspace.html',
  styleUrl: './create-workspace.css'
})
export class CreateWorkspace {
  name = '';
  description = '';
  error = '';
  isSubmitting = false;

  private workspaceService = inject(WorkspaceService);
  private router = inject(Router);

  onSubmit() {
    const trimmedName = this.name.trim();
    if (!trimmedName) {
      this.error = 'Workspace name is required.';
      return;
    }

    this.isSubmitting = true;
    this.error = '';

    this.workspaceService.createWorkspace(trimmedName, this.description.trim()).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: () => {
        this.error = 'Unable to create workspace. Please try again.';
        this.isSubmitting = false;
      }
    });
  }
}
