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
  styleUrls: ['./create-workspace.css']
})
export class CreateWorkspace {
  name = '';
  description = '';
  error = '';
  isSubmitting = false;
  activeField: 'name' | 'description' | '' = '';
  readonly nameMaxLength = 60;
  readonly descriptionMaxLength = 180;
  readonly nameSuggestions = ['Product Ops', 'Engineering Hub', 'Customer Success'];
  readonly descriptionSuggestions = [
    'Track incidents, escalations, and release updates in one place.',
    'Centralize signals and decisions for weekly planning and follow-ups.',
    'Collect cross-team notifications and keep execution aligned.'
  ];

  private workspaceService = inject(WorkspaceService);
  private router = inject(Router);

  get trimmedName(): string {
    return this.name.trim();
  }

  get trimmedDescription(): string {
    return this.description.trim();
  }

  get completionPercent(): number {
    let progress = 15;
    if (this.trimmedName.length > 0) {
      progress += 50;
    }
    if (this.trimmedDescription.length >= 20) {
      progress += 35;
    } else if (this.trimmedDescription.length > 0) {
      progress += 20;
    }
    return Math.min(progress, 100);
  }

  applyNameSuggestion(name: string) {
    if (this.isSubmitting) {
      return;
    }
    this.name = name;
    this.error = '';
  }

  applyDescriptionSuggestion(description: string) {
    if (this.isSubmitting) {
      return;
    }
    this.description = description;
    this.error = '';
  }

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
