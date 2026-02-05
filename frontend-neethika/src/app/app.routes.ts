import { Routes } from '@angular/router';
import { AuthPage } from './auth/auth-page/auth-page';

export const routes: Routes = [
  { path: '', redirectTo: 'auth', pathMatch: 'full' },
  { path: 'auth', component: AuthPage },
];