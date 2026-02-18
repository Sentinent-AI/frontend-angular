import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-create-workspace-placeholder',
    standalone: true,
    imports: [RouterLink],
    template: `
    <div style="padding: 20px;">
      <h2>Create Workspace</h2>
      <p>This feature is being implemented in Issue #4.</p>
      <a routerLink="/dashboard">Back to Dashboard</a>
    </div>
  `
})
export class CreateWorkspacePlaceholder { }
