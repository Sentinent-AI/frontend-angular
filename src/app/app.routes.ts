import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { authGuard } from './guards/auth-guard';
import { CreateWorkspace } from './components/workspace/create-workspace';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'signup', component: Login },
  {
    path: 'dashboard',
    loadComponent: () => import('./components/dashboard/dashboard').then(m => m.Dashboard),
    canActivate: [authGuard]
  },
  {
    path: 'workspace/create',
    component: CreateWorkspace,
    canActivate: [authGuard]
  },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' }
];
