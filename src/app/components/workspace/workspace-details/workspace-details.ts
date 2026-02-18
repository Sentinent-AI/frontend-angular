import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, RouterLink, RouterOutlet } from '@angular/router';
import { WorkspaceService } from '../../../services/workspace';
import { Workspace } from '../../../models/workspace';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-workspace-details',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink, RouterOutlet],
  templateUrl: './workspace-details.html',
  styleUrls: ['./workspace-details.css']
})
export class WorkspaceDetailsComponent implements OnInit {
  workspace$: Observable<Workspace | undefined> | undefined;

  constructor(
    private route: ActivatedRoute,
    private workspaceService: WorkspaceService
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.workspace$ = this.workspaceService.getWorkspace(id);
      }
    });
  }
}
