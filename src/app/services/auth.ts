import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { catchError, map, Observable, of, tap } from 'rxjs';

interface AuthResponse {
  token: string;
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

  logout(): Observable<void> {
    localStorage.removeItem(this.tokenKey);
    return this.http.post<void>(`${this.apiUrl}/logout`, {}).pipe(
      catchError(() => of(void 0)),
    );
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
