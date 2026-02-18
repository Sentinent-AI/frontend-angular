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

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
