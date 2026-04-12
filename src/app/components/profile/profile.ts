import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { UserProfile, UserProfileUpdate } from '../../models/user-profile.model';
import { UserProfileService } from '../../services/user-profile.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class ProfileComponent implements OnInit, OnDestroy {
  private static readonly PROFILE_LOAD_TIMEOUT_MS = 8000;

  private readonly userProfileService = inject(UserProfileService);
  private readonly cdr = inject(ChangeDetectorRef);
  private loadSubscription?: Subscription;
  private loadTimeoutId?: ReturnType<typeof setTimeout>;

  profile?: UserProfile;
  draft: UserProfileUpdate = {
    fullName: '',
    jobTitle: '',
    organization: '',
    timezone: '',
    bio: '',
    roleLabel: '',
  };
  isEditing = false;
  isSaving = false;
  isLoading = true;
  errorMessage = '';
  successMessage = '';

  ngOnInit(): void {
    this.loadProfile();
  }

  ngOnDestroy(): void {
    this.clearActiveLoad();
  }

  startEditing(): void {
    if (!this.profile) {
      return;
    }
    this.isEditing = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.draft = this.toDraft(this.profile);
  }

  cancelEditing(): void {
    this.isEditing = false;
    this.errorMessage = '';
    this.successMessage = '';
    if (this.profile) {
      this.draft = this.toDraft(this.profile);
    }
  }

  saveProfile(): void {
    if (!this.draft.fullName.trim()) {
      this.errorMessage = 'Full name is required.';
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.userProfileService.updateProfile({
      fullName: this.draft.fullName.trim(),
      jobTitle: this.draft.jobTitle.trim(),
      organization: this.draft.organization.trim(),
      timezone: this.draft.timezone.trim(),
      bio: this.draft.bio.trim(),
      roleLabel: this.draft.roleLabel.trim(),
    }).subscribe({
      next: (profile) => {
        this.profile = profile;
        this.draft = this.toDraft(profile);
        this.isEditing = false;
        this.isSaving = false;
        this.successMessage = 'Profile updated successfully.';
        this.syncView();
      },
      error: () => {
        this.isSaving = false;
        this.errorMessage = 'Unable to save your profile right now.';
        this.syncView();
      },
    });
  }

  retryLoadingProfile(): void {
    this.loadProfile();
  }

  displayName(): string {
    const resolvedName = this.displayValue(this.profile?.fullName);
    if (resolvedName) {
      return resolvedName;
    }

    const emailName = this.displayValue(this.profile?.email)?.split('@')[0] ?? '';
    if (!emailName) {
      return 'Sentinent User';
    }

    return emailName
      .split(/[^a-zA-Z0-9]+/)
      .filter(Boolean)
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' ');
  }

  profileInitial(): string {
    return this.displayName().charAt(0).toUpperCase() || '?';
  }

  withFallback(value: string | undefined, fallback: string): string {
    return this.displayValue(value) || fallback;
  }

  private loadProfile(): void {
    this.clearActiveLoad();
    this.isLoading = true;
    this.errorMessage = '';
    this.loadTimeoutId = setTimeout(() => {
      this.clearLoadTimeout();
      this.loadSubscription?.unsubscribe();
      this.loadSubscription = undefined;
      this.isLoading = false;
      this.errorMessage = 'Loading your profile is taking longer than expected. Please try again.';
      this.syncView();
    }, ProfileComponent.PROFILE_LOAD_TIMEOUT_MS);

    this.loadSubscription = this.userProfileService.getProfile().subscribe({
      next: (profile) => {
        this.clearLoadTimeout();
        this.loadSubscription = undefined;
        this.profile = profile;
        this.draft = this.toDraft(profile);
        this.isLoading = false;
        this.syncView();
      },
      error: (error: Error) => {
        this.clearLoadTimeout();
        this.loadSubscription = undefined;
        this.isLoading = false;
        this.errorMessage = error.message || 'Unable to load your profile right now.';
        this.syncView();
      },
    });
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

  private toDraft(profile: UserProfile): UserProfileUpdate {
    return {
      fullName: profile.fullName,
      jobTitle: profile.jobTitle,
      organization: profile.organization,
      timezone: profile.timezone,
      bio: profile.bio,
      roleLabel: profile.roleLabel,
    };
  }

  private displayValue(value: string | undefined): string {
    return (value ?? '').trim();
  }

  private syncView(): void {
    this.cdr.detectChanges();
  }
}
