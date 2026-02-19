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
  {
    path: 'workspaces/:id',
    loadComponent: () => import('./components/workspace/workspace-details/workspace-details').then(m => m.WorkspaceDetailsComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'decisions',
        loadComponent: () => import('./components/decision-list/decision-list.component').then(m => m.DecisionListComponent)
      },
      {
        path: 'decisions/new',
        loadComponent: () => import('./components/decision-form/decision-form.component').then(m => m.DecisionFormComponent)
      },
      {
        path: 'decisions/:decisionId/edit',
        loadComponent: () => import('./components/decision-form/decision-form.component').then(m => m.DecisionFormComponent)
      },
      { path: '', redirectTo: 'decisions', pathMatch: 'full' }
    ]
  },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' }
];
