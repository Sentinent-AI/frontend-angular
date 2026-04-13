import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { WorkspaceService } from '../../services/workspace';

@Component({
  selector: 'app-edit-workspace',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './edit-workspace.html',
  styleUrls: ['./edit-workspace.css']
})
export class EditWorkspaceComponent implements OnInit, OnDestroy {
  private static readonly WORKSPACE_LOAD_TIMEOUT_MS = 8000;

  workspaceId: string | null = null;
  name = '';
  description = '';
  error = '';
  isSubmitting = false;
  isLoading = true;
  hasWorkspace = false;
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
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  private loadSubscription?: Subscription;
  private loadTimeoutId?: ReturnType<typeof setTimeout>;

  get trimmedName(): string {
    return this.name.trim();
  }

  get trimmedDescription(): string {
    return this.description.trim();
  }

  get completionPercent(): number {
    let progress = 20;
    if (this.trimmedName.length > 0) {
      progress += 45;
    }
    if (this.trimmedDescription.length >= 20) {
      progress += 35;
    } else if (this.trimmedDescription.length > 0) {
      progress += 20;
    }
    return Math.min(progress, 100);
  }

  applyNameSuggestion(name: string) {
    if (this.isSubmitting || this.isLoading) {
      return;
    }
    this.name = name;
    this.error = '';
  }

  applyDescriptionSuggestion(description: string) {
    if (this.isSubmitting || this.isLoading) {
      return;
    }
    this.description = description;
    this.error = '';
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.workspaceId = params.get('id');
      if (this.workspaceId && /^\d+$/.test(this.workspaceId)) {
        this.loadWorkspace(this.workspaceId);
      } else {
        this.isLoading = false;
        this.hasWorkspace = false;
        this.error = 'Invalid workspace URL.';
        this.syncView();
      }
    });
  }

  ngOnDestroy(): void {
    this.clearActiveLoad();
  }

  loadWorkspace(id: string): void {
    this.clearActiveLoad();
    this.isLoading = true;
    this.hasWorkspace = false;
    this.error = '';

    this.loadTimeoutId = setTimeout(() => {
      this.clearLoadTimeout();
      this.loadSubscription?.unsubscribe();
      this.loadSubscription = undefined;
      this.isLoading = false;
      this.hasWorkspace = false;
      this.error = 'Loading workspace is taking longer than expected. Please try again.';
      this.syncView();
    }, EditWorkspaceComponent.WORKSPACE_LOAD_TIMEOUT_MS);

    this.loadSubscription = this.workspaceService.getWorkspace(id).subscribe({
      next: workspace => {
        this.clearLoadTimeout();
        this.loadSubscription = undefined;
        this.isLoading = false;
        if (workspace) {
          this.hasWorkspace = true;
          this.name = workspace.name;
          this.description = workspace.description || '';
        } else {
          this.hasWorkspace = false;
          this.error = 'Workspace not found';
        }
        this.syncView();
      },
      error: (error: Error) => {
        this.clearLoadTimeout();
        this.loadSubscription = undefined;
        this.isLoading = false;
        this.hasWorkspace = false;
        this.error = error.message || 'Unable to load workspace. Please try again.';
        this.syncView();
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
      next: (workspace) => {
        if (workspace) {
          this.router.navigate(['/dashboard']);
        } else {
          this.error = 'Workspace not found.';
          this.isSubmitting = false;
        }
      },
      error: () => {
        this.error = 'Unable to update workspace. Please try again.';
        this.isSubmitting = false;
      }
    });
  }

  retryLoad(): void {
    if (!this.workspaceId || !/^\d+$/.test(this.workspaceId)) {
      return;
    }
    this.loadWorkspace(this.workspaceId);
  }

  private clearActiveLoad(): void {
    this.loadSubscription?.unsubscribe();
    this.loadSubscription = undefined;
    this.clearLoadTimeout();
  }

  private clearLoadTimeout(): void {
    if (this.loadTimeoutId === undefined) {
      return;
    }
    clearTimeout(this.loadTimeoutId);
    this.loadTimeoutId = undefined;
  }

  private syncView(): void {
    this.cdr.detectChanges();
  }
}
