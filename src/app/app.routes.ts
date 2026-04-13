import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { authGuard } from './guards/auth-guard';
import { CreateWorkspace } from './components/workspace/create-workspace';
import { WorkspaceIntegrationsComponent } from './components/workspace-integrations/workspace-integrations';
import { WorkspaceMembersComponent } from './components/workspace-members/workspace-members';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'signup', component: Login },
  {
    path: 'reset-password/:token',
    loadComponent: () => import('./components/reset-password/reset-password').then(m => m.ResetPasswordComponent)
  },
  {
    path: 'invitations/:token',
    loadComponent: () => import('./components/accept-invitation/accept-invitation').then(m => m.AcceptInvitationComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./components/dashboard/dashboard').then(m => m.Dashboard),
    canActivate: [authGuard]
  },
  {
    path: 'profile',
    loadComponent: () => import('./components/profile/profile').then(m => m.ProfileComponent),
    canActivate: [authGuard]
  },
  {
    path: 'workspace/create',
    component: CreateWorkspace,
    canActivate: [authGuard]
  },
  {
    path: 'workspaces/:id/edit',
    loadComponent: () => import('./components/workspace/edit-workspace').then(m => m.EditWorkspaceComponent),
    canActivate: [authGuard]
  },
  {
    path: 'workspaces/:id/settings/members',
    component: WorkspaceMembersComponent,
    canActivate: [authGuard]
  },
  {
    path: 'workspaces/:id/settings/integrations',
    component: WorkspaceIntegrationsComponent,
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
        redirectTo: 'decisions',
        pathMatch: 'full'
      },
      { path: '', redirectTo: 'decisions', pathMatch: 'full' }
    ]
  },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' }
];
