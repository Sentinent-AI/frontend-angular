import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { WorkspaceService } from './workspace';
import { Workspace } from '../models/workspace';

describe('WorkspaceService', () => {
  let service: WorkspaceService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [WorkspaceService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(WorkspaceService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('maps the workspace list from the backend contract', () => {
    let workspaces: Array<{ id: string; ownerId: string; createdDate: Date }> = [];

    service.getWorkspaces().subscribe((result) => {
      workspaces = result;
    });

    const request = httpMock.expectOne('/api/workspaces');
    expect(request.request.method).toBe('GET');
    request.flush([
      {
        id: 1,
        name: 'Engineering',
        description: 'Platform team',
        owner_id: 7,
        created_at: '2026-03-24T10:00:00Z',
      },
    ]);

    expect(workspaces.length).toBe(1);
    expect(workspaces[0].id).toBe('1');
    expect(workspaces[0].ownerId).toBe('7');
    expect(workspaces[0].createdDate instanceof Date).toBeTrue();
  });

  it('creates a workspace through the backend API', () => {
    let createdName = '';

    service.createWorkspace('Support', 'Support team workspace').subscribe((result) => {
      createdName = result.name;
    });

    const request = httpMock.expectOne('/api/workspaces');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      name: 'Support',
      description: 'Support team workspace',
    });
    request.flush({
      id: 2,
      name: 'Support',
      description: 'Support team workspace',
      owner_id: 9,
      created_at: '2026-03-24T11:00:00Z',
    });

    expect(createdName).toBe('Support');
  });

  it('returns undefined when a workspace is missing', () => {
    let resultValue = 'unset';

    service.getWorkspace('404').subscribe((result) => {
      resultValue = result === undefined ? 'undefined' : 'defined';
    });

    const request = httpMock.expectOne('/api/workspaces/404');
    expect(request.request.method).toBe('GET');
    request.flush('Workspace not found', { status: 404, statusText: 'Not Found' });

    expect(resultValue).toBe('undefined');
  });

  it('deletes a workspace through the backend API', () => {
    let deleted = false;

    service.deleteWorkspace('3').subscribe((result) => {
      deleted = result;
    });

    const request = httpMock.expectOne('/api/workspaces/3');
    expect(request.request.method).toBe('DELETE');
    request.flush(null, { status: 204, statusText: 'No Content' });

    expect(deleted).toBeTrue();
  });

  it('updates a workspace through the backend API', () => {
    let updatedWorkspace: Workspace | undefined;

    service.updateWorkspace('1', 'Updated Workspace', 'Updated description').subscribe((result) => {
      updatedWorkspace = result;
    });

    const request = httpMock.expectOne('/api/workspaces/1');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({
      name: 'Updated Workspace',
      description: 'Updated description'
    });
    request.flush({
      id: 1,
      name: 'Updated Workspace',
      description: 'Updated description',
      owner_id: 7,
      created_at: '2026-03-24T10:00:00Z',
    });

    expect(updatedWorkspace).toBeTruthy();
    expect(updatedWorkspace?.id).toBe('1');
    expect(updatedWorkspace?.name).toBe('Updated Workspace');
    expect(updatedWorkspace?.description).toBe('Updated description');
  });

  it('returns undefined when updating a missing workspace', () => {
    let resultValue: Workspace | undefined = undefined;

    service.updateWorkspace('999', 'Nonexistent', 'Description').subscribe((result) => {
      resultValue = result;
    });

    const request = httpMock.expectOne('/api/workspaces/999');
    expect(request.request.method).toBe('PATCH');
    request.flush('Workspace not found', { status: 404, statusText: 'Not Found' });

    expect(resultValue).toBeUndefined();
  });
});
