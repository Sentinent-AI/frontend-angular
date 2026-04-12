import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { catchError, map, Observable, throwError, timeout } from 'rxjs';
import { UserProfile, UserProfileUpdate } from '../models/user-profile.model';
import { toError } from './http-error';

interface UserProfileResponse {
  full_name?: string;
  fullName?: string;
  email?: string;
  job_title?: string;
  jobTitle?: string;
  organization?: string;
  timezone?: string;
  bio?: string;
  role_label?: string;
  roleLabel?: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserProfileService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/profile';

  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfileResponse>(this.apiUrl).pipe(
      timeout(5000),
      map((response) => this.mapProfile(response)),
      catchError((error) => throwError(() => toError(error, 'Unable to load profile.'))),
    );
  }

  updateProfile(update: UserProfileUpdate): Observable<UserProfile> {
    return this.http.patch<UserProfileResponse>(this.apiUrl, {
      full_name: update.fullName,
      job_title: update.jobTitle,
      organization: update.organization,
      timezone: update.timezone,
      bio: update.bio,
      role_label: update.roleLabel,
    }).pipe(
      timeout(5000),
      map((response) => this.mapProfile(response)),
      catchError((error) => throwError(() => toError(error, 'Unable to update profile.'))),
    );
  }

  private mapProfile(response: UserProfileResponse): UserProfile {
    return {
      fullName: this.readField(response.full_name ?? response.fullName),
      email: this.readField(response.email),
      jobTitle: this.readField(response.job_title ?? response.jobTitle),
      organization: this.readField(response.organization),
      timezone: this.readField(response.timezone),
      bio: this.readField(response.bio),
      roleLabel: this.readField(response.role_label ?? response.roleLabel),
    };
  }

  private readField(value: unknown): string {
    return typeof value === 'string' ? value : '';
  }
}
