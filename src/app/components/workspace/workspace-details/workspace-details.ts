import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, RouterLink, RouterOutlet } from '@angular/router';
import { WorkspaceService } from '../../../services/workspace';
import { Workspace } from '../../../models/workspace';
import { WorkspaceMemberService } from '../../../services/workspace-member.service';
import { WorkspaceMember } from '../../../models/workspace-member.model';
import { Observable } from 'rxjs';
import { AppNavComponent } from '../../app-nav/app-nav';

@Component({
  selector: 'app-workspace-details',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink, RouterOutlet],
  templateUrl: './workspace-details.html',
  styleUrls: ['./workspace-details.css']
})
export class WorkspaceDetailsComponent implements OnInit {
  workspace$: Observable<Workspace | undefined> | undefined;
  members: WorkspaceMember[] = [];

  constructor(
    private route: ActivatedRoute,
    private workspaceService: WorkspaceService,
    private memberService: WorkspaceMemberService
  ) { }

  ngOnInit(): void {
    let currentId: string | null = null;
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id && id !== currentId) {
        currentId = id;
        this.workspace$ = this.workspaceService.getWorkspace(id);
        this.loadMembers(id);
      }
    });
  }

  private loadMembers(workspaceId: string): void {
    this.memberService.getMembers(workspaceId).subscribe({
      next: members => { this.members = members; },
      error: () => {}
    });
  }

  getWorkspaceInitials(name: string): string {
    return name.trim().split(/\s+/).slice(0, 2).map(p => p.charAt(0).toUpperCase()).join('') || 'WS';
  }

  getWorkspaceHealth(description: string): string {
    if (description.trim().length >= 20) return 'Configured';
    if (description.trim().length > 0) return 'In Progress';
    return 'Needs Detail';
  }

  getRoleBadgeClass(role: string): string {
    if (role === 'owner') return 'role-owner';
    if (role === 'viewer') return 'role-viewer';
    return 'role-member';
  }
}
