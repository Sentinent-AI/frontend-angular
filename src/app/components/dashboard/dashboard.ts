import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';
import { WorkspaceService } from '../../services/workspace';
import { Workspace } from '../../models/workspace';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private authService = inject(AuthService);
  private workspaceService = inject(WorkspaceService);
  private router = inject(Router);

  workspaces: Workspace[] = [];

  ngOnInit() {
    this.workspaceService.getWorkspaces().subscribe(ws => {
      this.workspaces = ws;
    });
  }

  editWorkspace(workspace: Workspace) {
    const updatedName = window.prompt('Edit workspace name', workspace.name)?.trim();
    if (!updatedName) {
      return;
    }

    const updatedDescriptionInput = window.prompt('Edit workspace description', workspace.description ?? '');
    if (updatedDescriptionInput === null) {
      return;
    }

    const updatedDescription = updatedDescriptionInput.trim();

    this.workspaceService.updateWorkspace(workspace.id, updatedName, updatedDescription).subscribe(updatedWorkspace => {
      if (!updatedWorkspace) {
        return;
      }
      this.workspaces = this.workspaces.map(ws => ws.id === updatedWorkspace.id ? updatedWorkspace : ws);
    });
  }

  deleteWorkspace(workspace: Workspace) {
    const confirmed = window.confirm(`Delete workspace "${workspace.name}"?`);
    if (!confirmed) {
      return;
    }

    this.workspaceService.deleteWorkspace(workspace.id).subscribe(deleted => {
      if (!deleted) {
        return;
      }
      this.workspaces = this.workspaces.filter(ws => ws.id !== workspace.id);
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
