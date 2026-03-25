import { TestBed } from '@angular/core/testing';
import { WorkspaceService } from './workspace';
import { Workspace } from '../models/workspace';

describe('WorkspaceService', () => {
  let service: WorkspaceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WorkspaceService);
  });

  it('returns the seeded workspaces', () => {
    let workspaces: Workspace[] = [];

    service.getWorkspaces().subscribe(result => {
      workspaces = result;
    });

    expect(workspaces.length).toBe(3);
    expect(workspaces.map(workspace => workspace.name)).toContain('Engineering');
  });

  it('creates a new workspace', () => {
    let createdName = '';
    let workspaceCount = 0;

    service.createWorkspace('Support', 'Support team workspace').subscribe(result => {
      createdName = result.name;
    });

    service.getWorkspaces().subscribe(result => {
      workspaceCount = result.length;
    });

    expect(createdName).toBe('Support');
    expect(workspaceCount).toBe(4);
  });

  it('updates an existing workspace', () => {
    let updatedDescription: string | undefined;

    service.updateWorkspace('1', 'Engineering', 'Updated description').subscribe(result => {
      updatedDescription = result?.description;
    });

    expect(updatedDescription).toBe('Updated description');
  });

  it('returns undefined when updating a missing workspace', () => {
    let resultValue = 'unset';

    service.updateWorkspace('missing', 'Name', 'Description').subscribe(result => {
      resultValue = result === undefined ? 'undefined' : 'defined';
    });

    expect(resultValue).toBe('undefined');
  });

  it('deletes an existing workspace', () => {
    let deleted = false;
    let workspaceCount = 0;

    service.deleteWorkspace('3').subscribe(result => {
      deleted = result;
    });

    service.getWorkspaces().subscribe(result => {
      workspaceCount = result.length;
    });

    expect(deleted).toBeTrue();
    expect(workspaceCount).toBe(2);
  });
});
