import { Injectable } from '@angular/core';
import { Session } from '@supabase/supabase-js';
import { from, map, Observable } from 'rxjs';
import { supabase } from '../supabase';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  signup(email: string, password: string): Observable<void> {
    return from(supabase.auth.signUp({
      email,
      password
    })).pipe(
      map(({ error }) => {
        if (error) {
          throw this.normalizeError(error.message);
        }
        return undefined;
      })
    );
  }

  login(email: string, password: string): Observable<Session> {
    return from(supabase.auth.signInWithPassword({
      email,
      password
    })).pipe(
      map(({ data, error }) => {
        if (error) {
          throw this.normalizeError(error.message);
        }
        if (!data.session) {
          throw this.normalizeError('Sign in failed. Please try again.');
        }
        return data.session;
      })
    );
  }

  resetPassword(email: string): Observable<void> {
    return from(supabase.auth.resetPasswordForEmail(email, {
      redirectTo: environment.passwordResetRedirectUrl
    })).pipe(
      map(({ error }) => {
        if (error) {
          throw this.normalizeError(error.message);
        }
        return undefined;
      })
    );
  }

  logout(): Observable<void> {
    return from(supabase.auth.signOut()).pipe(
      map(({ error }) => {
        if (error) {
          throw this.normalizeError(error.message);
        }
        return undefined;
      })
    );
  }

  isLoggedIn(): Observable<boolean> {
    return from(supabase.auth.getSession()).pipe(
      map(({ data, error }) => {
        if (error) {
          return false;
        }
        return !!data.session;
      })
    );
  }

  private normalizeError(message: string): Error {
    const normalizedMessage = message.trim();

    if (!normalizedMessage) {
      return new Error('Authentication failed. Please try again.');
    }

    return new Error(normalizedMessage);
  }
}
