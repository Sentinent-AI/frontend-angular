import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { map, Observable, tap } from 'rxjs';

interface AuthResponse {
  token: string;
}

interface ForgotPasswordResponse {
  message: string;
  reset_url?: string;
}

interface ResetTokenValidationResponse {
  valid: boolean;
  email: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = '/api';
  private tokenKey = 'sentinent_token';

  signup(email: string, password: string): Observable<void> {
    return this.http.post(`${this.apiUrl}/signup`, { email, password }, {
      observe: 'response',
      responseType: 'text'
    }).pipe(
      map((_res: HttpResponse<string>) => undefined)
    );
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap(res => this.setToken(res.token))
    );
  }

  requestPasswordReset(email: string): Observable<{ message: string; resetUrl?: string }> {
    return this.http.post<ForgotPasswordResponse>(`${this.apiUrl}/forgot-password`, { email }).pipe(
      map((response) => ({
        message: response.message,
        resetUrl: response.reset_url,
      })),
    );
  }

  validatePasswordResetToken(token: string): Observable<{ valid: boolean; email: string }> {
    return this.http.get<ResetTokenValidationResponse>(`${this.apiUrl}/reset-password/${token}`).pipe(
      map((response) => ({
        valid: response.valid,
        email: response.email,
      })),
    );
  }

  resetPassword(token: string, password: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/reset-password/${token}`, { password });
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  private setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }
}
